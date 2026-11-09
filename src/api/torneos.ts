import { api } from './cliente'

export type EstadoTorneo = 'proximo' | 'en_curso' | 'finalizado'

export type Torneo = {
  id: number
  nombre: string
  estado: EstadoTorneo
  fechaInicio: string | null
  fechaFin: string | null
  totalJornadas: number
  jornadasFinalizadas: number
}

export type DatosTorneo = { nombre: string; fechaInicio: string | null; fechaFin: string | null }

export const ESTADOS_TORNEO: Record<EstadoTorneo, { texto: string; clase: string }> = {
  proximo: { texto: 'Próximo', clase: 'border-sky-300/40 bg-sky-400/10 text-sky-200' },
  en_curso: { texto: 'En curso', clase: 'border-primary/40 bg-primary/15 text-primary' },
  finalizado: { texto: 'Finalizado', clase: 'border-white/20 bg-white/5 text-white/60' },
}

export const torneosApi = {
  listar: () => api<Torneo[]>('/api/admin/torneos'),
  crear: (d: DatosTorneo) => api<Torneo>('/api/admin/torneos', { metodo: 'POST', cuerpo: d }),
  editar: (id: number, d: DatosTorneo) => api<Torneo>(`/api/admin/torneos/${id}`, { metodo: 'PUT', cuerpo: d }),
  accion: (id: number, accion: 'iniciar' | 'finalizar') => api<Torneo>(`/api/admin/torneos/${id}/${accion}`, { metodo: 'POST' }),
  eliminar: (id: number) => api<void>(`/api/admin/torneos/${id}`, { metodo: 'DELETE' }),
}
