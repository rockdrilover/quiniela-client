import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  alCambiarSesion,
  api,
  guardarSesion,
  hayRefreshGuardado,
  limpiarSesion,
  renovarSesion,
  type Tokens,
  type Usuario,
} from '../api/cliente'

type Estado = 'cargando' | 'autenticado' | 'anonimo'

export type DatosRegistro = {
  username: string
  nombre: string
  correo: string
  password: string
  confirmacion: string
}

type AuthValor = {
  estado: Estado
  usuario: Usuario | null
  entrar: (usuario: string, password: string) => Promise<Usuario>
  registrar: (datos: DatosRegistro) => Promise<Usuario>
  salir: () => Promise<void>
  actualizarUsuario: (cambios: Partial<Usuario>) => void
  cambiarPassword: (actual: string, nueva: string, confirmacion: string) => Promise<void>
}

const AuthContext = createContext<AuthValor | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [estado, setEstado] = useState<Estado>(hayRefreshGuardado() ? 'cargando' : 'anonimo')

  // Al abrir la app: si hay un refresh token guardado, recupera la sesión sin pedir contraseña
  useEffect(() => {
    if (!hayRefreshGuardado()) return
    let vivo = true
    const intentar = (espera: number) =>
      renovarSesion()
        .then((t) => {
          if (!vivo) return
          setUsuario(t?.usuario ?? null)
          setEstado(t ? 'autenticado' : 'anonimo')
        })
        // Servidor caído: se reintenta sin borrar la sesión guardada
        .catch(() => vivo && setTimeout(() => intentar(Math.min(espera * 2, 30000)), espera))
    intentar(2000)
    return () => {
      vivo = false
    }
  }, [])

  // Si la sesión se renueva o se pierde en segundo plano, refleja el cambio
  useEffect(
    () =>
      alCambiarSesion((t) => {
        setUsuario(t?.usuario ?? null)
        setEstado(t ? 'autenticado' : 'anonimo')
      }),
    [],
  )

  const entrar = useCallback(async (u: string, password: string) => {
    const t = await api<Tokens>('/api/auth/login', { metodo: 'POST', cuerpo: { usuario: u, password }, sinToken: true })
    guardarSesion(t)
    setUsuario(t.usuario)
    setEstado('autenticado')
    return t.usuario
  }, [])

  /** Crea la cuenta (queda "pendiente") y deja la sesión iniciada. */
  const registrar = useCallback(async (datos: DatosRegistro) => {
    const t = await api<Tokens>('/api/auth/registro', { metodo: 'POST', cuerpo: datos, sinToken: true })
    guardarSesion(t)
    setUsuario(t.usuario)
    setEstado('autenticado')
    return t.usuario
  }, [])

  const salir = useCallback(async () => {
    const refresh = localStorage.getItem('quiniela.refresh')
    if (refresh) {
      await api('/api/auth/logout', { metodo: 'POST', cuerpo: { refreshToken: refresh }, sinToken: true }).catch(() => {})
    }
    limpiarSesion()
    setUsuario(null)
    setEstado('anonimo')
  }, [])

  /** Refleja en el encabezado cambios hechos desde el perfil (p. ej. el nombre). */
  const actualizarUsuario = useCallback((cambios: Partial<Usuario>) => {
    setUsuario((u) => (u ? { ...u, ...cambios } : u))
  }, [])

  /** Cambia la contraseña; la API cierra las demás sesiones y devuelve tokens nuevos para esta. */
  const cambiarPassword = useCallback(async (actual: string, nueva: string, confirmacion: string) => {
    const t = await api<Tokens>('/api/auth/password', { metodo: 'PUT', cuerpo: { actual, nueva, confirmacion } })
    guardarSesion(t)
    setUsuario(t.usuario)
  }, [])

  const valor = useMemo(
    () => ({ estado, usuario, entrar, registrar, salir, actualizarUsuario, cambiarPassword }),
    [estado, usuario, entrar, registrar, salir, actualizarUsuario, cambiarPassword],
  )
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
