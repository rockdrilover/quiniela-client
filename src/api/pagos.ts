import { api, apiArchivo } from './cliente'
import type { EstadoComprobante, EstadoQuiniela, TipoPago } from './quinielas'

type QuinielaRef = { id: number; folio: number; numero: number; estado: EstadoQuiniela; monto: number }
type UsuarioRef = { id: number; username: string; nombre: string; avatar: string | null }
type JornadaRef = { id: number; nombre: string }

export type ComprobanteAdmin = {
  id: number
  /** "manual": el admin registró el pago (efectivo, etc.) y no hay archivo. */
  tipo: TipoPago
  estado: EstadoComprobante
  subidoAt: string
  mimeType: string | null
  tamanoBytes: number | null
  visto: boolean
  revisadoAt: string | null
  motivoRechazo: string | null
  nota: string | null
  quiniela: QuinielaRef
  usuario: UsuarioRef
  jornada: JornadaRef
}

/** Quiniela enviada que espera pago: el admin puede registrarlo si le pagaron por fuera. */
export type PorCobrar = {
  quiniela: QuinielaRef
  usuario: UsuarioRef
  jornada: JornadaRef
  enviadaAt: string | null
  motivoRechazo: string | null
}

export type ListaPagos = {
  conteos: Record<EstadoComprobante | 'por_cobrar', number>
  elementos: ComprobanteAdmin[]
}

export const pagosApi = {
  listar: (estado: EstadoComprobante) => api<ListaPagos>(`/api/admin/pagos?estado=${estado}`),
  porCobrar: () => api<PorCobrar[]>('/api/admin/pagos/por-cobrar'),
  /** Abrirlo lo marca como visto (requisito para validar). */
  archivo: (id: number) => apiArchivo(`/api/admin/pagos/${id}/archivo`),
  aprobar: (id: number) => api<ComprobanteAdmin>(`/api/admin/pagos/${id}/aprobar`, { metodo: 'PUT' }),
  rechazar: (id: number, motivo: string) =>
    api<ComprobanteAdmin>(`/api/admin/pagos/${id}/rechazar`, { metodo: 'PUT', cuerpo: { motivo } }),
  pagoManual: (idQuiniela: number, nota: string) =>
    api<ComprobanteAdmin>(`/api/admin/quinielas/${idQuiniela}/pago-manual`, {
      metodo: 'POST',
      cuerpo: { nota: nota.trim() || null },
    }),
}
