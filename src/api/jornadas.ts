import { api } from './cliente'

export type Equipo = { id: number; nombre: string; abreviatura: string; urlLogo: string | null }

export type EstadoVisual = 'BORRADOR' | 'ACTIVA' | 'CERRADA' | 'EN_JUEGO' | 'FINALIZADA'

export type Jornada = {
  id: number
  numero: number
  nombre: string
  estado: 'borrador' | 'abierta' | 'cerrada' | 'finalizada'
  estadoVisual: EstadoVisual
  visible: boolean
  precio: number
  pctPremio: number
  fechaCierre: string | null
  totalPartidos: number
  partidosFinalizados: number
  totalQuinielas: number
  aceptaPronosticos: boolean
}

export type Partido = {
  id: number
  orden: number
  local: Equipo
  visitante: Equipo
  fechaHora: string
  golesLocal: number | null
  golesVisitante: number | null
  resultado: 'L' | 'E' | 'V' | null
  estado: 'programado' | 'finalizado' | 'suspendido'
}

export type JornadaDetalle = { jornada: Jornada; partidos: Partido[] }
export type ListaJornadas = {
  idTemporada: number
  temporada: string
  estadoTemporada: 'proximo' | 'en_curso' | 'finalizado'
  jornadas: Jornada[]
}

export const jornadasApi = {
  equipos: () => api<Equipo[]>('/api/equipos'),
  listar: (idTemporada?: number) =>
    api<ListaJornadas>(`/api/admin/jornadas${idTemporada ? `?idTemporada=${idTemporada}` : ''}`),
  detalle: (id: number) => api<JornadaDetalle>(`/api/admin/jornadas/${id}`),
  crear: (datos: { idTemporada?: number; nombre?: string; precio: number; pctPremio?: number }) =>
    api<JornadaDetalle>('/api/admin/jornadas', { metodo: 'POST', cuerpo: datos }),
  editar: (id: number, datos: { nombre?: string; precio: number; pctPremio?: number }) =>
    api<JornadaDetalle>(`/api/admin/jornadas/${id}`, { metodo: 'PUT', cuerpo: datos }),
  renombrar: (id: number, nombre: string) =>
    api<JornadaDetalle>(`/api/admin/jornadas/${id}/nombre`, { metodo: 'PUT', cuerpo: { nombre } }),
  eliminar: (id: number) => api<void>(`/api/admin/jornadas/${id}`, { metodo: 'DELETE' }),
  accion: (id: number, accion: 'abrir' | 'cerrar' | 'finalizar') =>
    api<JornadaDetalle>(`/api/admin/jornadas/${id}/${accion}`, { metodo: 'POST' }),
  visible: (id: number, visible: boolean) =>
    api<JornadaDetalle>(`/api/admin/jornadas/${id}/visible`, { metodo: 'PUT', cuerpo: { visible } }),

  agregarPartido: (idJornada: number, p: { idLocal: number; idVisitante: number; fechaHora: string }) =>
    api<JornadaDetalle>(`/api/admin/jornadas/${idJornada}/partidos`, { metodo: 'POST', cuerpo: p }),
  editarPartido: (id: number, p: { idLocal: number; idVisitante: number; fechaHora: string }) =>
    api<JornadaDetalle>(`/api/admin/partidos/${id}`, { metodo: 'PUT', cuerpo: p }),
  eliminarPartido: (id: number) => api<JornadaDetalle>(`/api/admin/partidos/${id}`, { metodo: 'DELETE' }),
  resultado: (id: number, golesLocal: number, golesVisitante: number) =>
    api<JornadaDetalle>(`/api/admin/partidos/${id}/resultado`, { metodo: 'PUT', cuerpo: { golesLocal, golesVisitante } }),
  suspender: (id: number) => api<JornadaDetalle>(`/api/admin/partidos/${id}/suspender`, { metodo: 'POST' }),
}
