import { api, apiArchivo } from './cliente'
import type { EstadoComprobante, EstadoQuiniela } from './quinielas'

export type ComprobanteAdmin = {
  id: number
  estado: EstadoComprobante
  subidoAt: string
  mimeType: string
  tamanoBytes: number
  visto: boolean
  revisadoAt: string | null
  motivoRechazo: string | null
  quiniela: { id: number; folio: number; numero: number; estado: EstadoQuiniela; monto: number }
  usuario: { id: number; username: string; nombre: string }
  jornada: { id: number; nombre: string }
}

export type ListaPagos = { conteos: Record<EstadoComprobante, number>; elementos: ComprobanteAdmin[] }

export const pagosApi = {
  listar: (estado: EstadoComprobante) => api<ListaPagos>(`/api/admin/pagos?estado=${estado}`),
  /** Abrirlo lo marca como visto (requisito para validar). */
  archivo: (id: number) => apiArchivo(`/api/admin/pagos/${id}/archivo`),
  aprobar: (id: number) => api<ComprobanteAdmin>(`/api/admin/pagos/${id}/aprobar`, { metodo: 'PUT' }),
  rechazar: (id: number, motivo: string) =>
    api<ComprobanteAdmin>(`/api/admin/pagos/${id}/rechazar`, { metodo: 'PUT', cuerpo: { motivo } }),
}
