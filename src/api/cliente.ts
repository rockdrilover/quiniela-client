/**
 * Cliente HTTP de la API.
 *  - El accessToken (15 min) vive solo en memoria.
 *  - El refreshToken (30 días, cambia en cada uso) se guarda en localStorage para mantener la sesión.
 *  - Si una petición responde 401, se renueva la sesión una vez y se reintenta.
 *  - La renovación usa un candado entre pestañas: dos pestañas no pueden usar el mismo refresh token,
 *    porque la API lo tomaría como robo y cerraría todas las sesiones.
 */

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

const CLAVE_REFRESH = 'quiniela.refresh'

export type Usuario = {
  id: number
  username: string
  nombre: string
  correo: string
  rol: 'admin' | 'usuario'
  estado: 'pendiente' | 'aprobado' | 'bloqueado'
}

export type Tokens = {
  accessToken: string
  refreshToken: string
  expiraEn: number
  usuario: Usuario
}

/** Error que viene de la API (formato ProblemDetail). `mensaje` es el texto para mostrar al usuario. */
export class ApiError extends Error {
  readonly status: number
  readonly codigo?: string
  readonly campos?: Record<string, string>
  readonly reintentarEn?: number

  constructor(status: number, cuerpo: Partial<{ detail: string; codigo: string; campos: Record<string, string>; reintentarEn: number }>) {
    super(cuerpo.detail ?? 'Ocurrió un error inesperado. Intenta de nuevo')
    this.status = status
    this.codigo = cuerpo.codigo
    this.campos = cuerpo.campos
    this.reintentarEn = cuerpo.reintentarEn
  }
}

let accessToken: string | null = null
let renovando: Promise<Tokens | null> | null = null
const oyentes = new Set<(t: Tokens | null) => void>()

export function guardarSesion(t: Tokens) {
  accessToken = t.accessToken
  escribirRefresh(t.refreshToken)
}

export function limpiarSesion() {
  accessToken = null
  escribirRefresh(null)
}

export function hayRefreshGuardado() {
  return leerRefresh() !== null
}

/** Avisa a la app cuando la sesión se renueva o se pierde (para actualizar el usuario o mandar al login). */
export function alCambiarSesion(fn: (t: Tokens | null) => void) {
  oyentes.add(fn)
  return () => {
    oyentes.delete(fn)
  }
}

/** Renueva la sesión con el refresh token. Una sola renovación a la vez aunque la pidan varias llamadas. */
export function renovarSesion(): Promise<Tokens | null> {
  renovando ??= conCandado(async () => {
    const refresh = leerRefresh()
    if (!refresh) return null
    const r = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    if (!r.ok) {
      // Servidor caído o reiniciándose (502/503...): no es que la sesión sea inválida, se conserva
      if (r.status !== 400 && r.status !== 401) throw new Error('Servidor no disponible')
      // Si otra pestaña ya lo renovó mientras esperábamos, su token nuevo sigue siendo válido
      if (leerRefresh() !== refresh) return null
      limpiarSesion()
      return null
    }
    const t = (await r.json()) as Tokens
    guardarSesion(t)
    return t
  })
    .then((t) => {
      oyentes.forEach((fn) => fn(t))
      return t
    })
    .finally(() => {
      renovando = null
    })
  return renovando
}

type Opciones = { metodo?: string; cuerpo?: unknown; sinToken?: boolean }

/**
 * Llama a la API y devuelve el JSON (o undefined si la respuesta no tiene cuerpo). Lanza ApiError si falla.
 * Si el cuerpo es FormData se manda como multipart (para subir archivos).
 */
export async function api<T = unknown>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const r = await pedir(ruta, opciones)
  if (r.status === 204 || r.headers.get('Content-Length') === '0') return undefined as T
  const texto = await r.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}

/** Descarga un archivo protegido (con el token) para mostrarlo con URL.createObjectURL. */
export async function apiArchivo(ruta: string): Promise<Blob> {
  return (await pedir(ruta, {})).blob()
}

async function pedir(ruta: string, { metodo = 'GET', cuerpo, sinToken = false }: Opciones): Promise<Response> {
  const esForm = cuerpo instanceof FormData
  const hacer = () => {
    const headers: Record<string, string> = {}
    if (cuerpo !== undefined && !esForm) headers['Content-Type'] = 'application/json'
    if (!sinToken && accessToken) headers.Authorization = `Bearer ${accessToken}`
    return fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : esForm ? cuerpo : JSON.stringify(cuerpo),
    })
  }

  let r: Response
  try {
    r = await hacer()
    if (r.status === 401 && !sinToken && hayRefreshGuardado()) {
      const t = await renovarSesion()
      if (t) r = await hacer()
    }
  } catch {
    throw new ApiError(0, { detail: 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo' })
  }

  if (!r.ok) {
    const datos = await r.json().catch(() => ({}))
    throw new ApiError(r.status, datos)
  }
  return r
}

// ---------------------------------------------------------------- internos

function leerRefresh(): string | null {
  try {
    return localStorage.getItem(CLAVE_REFRESH)
  } catch {
    return null
  }
}

function escribirRefresh(valor: string | null) {
  try {
    if (valor) localStorage.setItem(CLAVE_REFRESH, valor)
    else localStorage.removeItem(CLAVE_REFRESH)
  } catch {
    // almacenamiento bloqueado (modo privado): la sesión dura mientras la pestaña esté abierta
  }
}

function conCandado<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('quiniela-refresh', fn)
  }
  return fn()
}
