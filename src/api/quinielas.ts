import { api, apiArchivo } from './cliente'
import type { Jornada, JornadaDetalle } from './jornadas'

export type EstadoQuiniela = 'borrador' | 'pendiente_pago' | 'en_revision' | 'participando' | 'rechazada'
export type Seleccion = 'L' | 'E' | 'V'

export type Quiniela = {
  id: number
  folio: number
  numero: number
  estado: EstadoQuiniela
  monto: number
  creadaAt: string
  enviadaAt: string | null
  actualizadaAt: string
  idJornada: number
  pronosticados: number
  totalPartidos: number
  puntos: number | null
  exactos: number
  editable: boolean
}

export type MisQuinielas = {
  actual: Jornada | null
  puedeCrear: boolean
  motivoNoPuedeCrear: string | null
  jornadas: Jornada[]
  quinielas: Quiniela[]
}

export type Pronostico = {
  idPartido: number
  golesLocal: number
  golesVisitante: number
  seleccion: Seleccion
  puntos: number | null
  exacto: boolean
}

export type EstadoComprobante = 'en_revision' | 'aprobado' | 'rechazado'

export type Comprobante = {
  id: number
  estado: EstadoComprobante
  subidoAt: string
  mimeType: string
  motivoRechazo: string | null
}

export type Pago = { puedeSubir: boolean; comprobante: Comprobante | null }

export type QuinielaDetalle = { quiniela: Quiniela; jornada: JornadaDetalle; pronosticos: Pronostico[]; pago: Pago }

/** Mismo límite que la API. */
export const MAX_BYTES_COMPROBANTE = 10 * 1024 * 1024

export type PronosticoEntrada = { idPartido: number; golesLocal: number; golesVisitante: number }

export const quinielasApi = {
  /** null si todavía no hay jornada publicada (204). */
  jornadaActual: () => api<JornadaDetalle | undefined>('/api/jornadas/actual'),
  mias: () => api<MisQuinielas>('/api/quinielas'),
  detalle: (id: number) => api<QuinielaDetalle>(`/api/quinielas/${id}`),
  crear: (idJornada: number, pronosticos: PronosticoEntrada[], enviar: boolean) =>
    api<QuinielaDetalle>('/api/quinielas', { metodo: 'POST', cuerpo: { idJornada, pronosticos, enviar } }),
  guardar: (id: number, pronosticos: PronosticoEntrada[], enviar: boolean) =>
    api<QuinielaDetalle>(`/api/quinielas/${id}`, { metodo: 'PUT', cuerpo: { pronosticos, enviar } }),
  eliminar: (id: number) => api<void>(`/api/quinielas/${id}`, { metodo: 'DELETE' }),
  subirComprobante: (id: number, archivo: File) => {
    const datos = new FormData()
    datos.append('archivo', archivo)
    return api<QuinielaDetalle>(`/api/quinielas/${id}/comprobante`, { metodo: 'POST', cuerpo: datos })
  },
  verComprobante: (id: number) => apiArchivo(`/api/quinielas/${id}/comprobante`),
}

/** Lógica espejo: el botón L/E/V se deriva siempre del marcador. */
export function seleccionDe(local: number, visitante: number): Seleccion {
  return local > visitante ? 'L' : local < visitante ? 'V' : 'E'
}
