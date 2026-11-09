import { api } from './cliente'
import type { EstadoVisual, Jornada, Partido } from './jornadas'
import type { Seleccion } from './quinielas'

export type JornadaOpcion = { id: number; numero: number; nombre: string; estadoVisual: EstadoVisual }
export type JornadasRanking = { actual: number | null; jornadas: JornadaOpcion[] }

export type Celda = {
  idPartido: number
  golesLocal: number
  golesVisitante: number
  seleccion: Seleccion
  puntos: number | null
  exacto: boolean
}

export type FilaRanking = {
  posicion: number
  idQuiniela: number
  folio: number
  numero: number
  idUsuario: number
  username: string
  avatar: string | null
  variasQuinielas: boolean
  puntos: number
  exactos: number
  esMia: boolean
  ganador: boolean
  premio: number | null
  pronosticos: Celda[]
}

export type Ranking = {
  jornada: Jornada
  partidos: Partido[]
  bolsa: { participantes: number; recaudado: number; bolsa: number }
  pronosticosVisibles: boolean
  filas: FilaRanking[]
}

export const rankingApi = {
  jornadas: () => api<JornadasRanking>('/api/ranking/jornadas'),
  /** undefined si todavía no hay jornada publicada. */
  ver: (idJornada?: number) => api<Ranking | undefined>(`/api/ranking${idJornada ? `?idJornada=${idJornada}` : ''}`),
}
