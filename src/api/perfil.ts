import type { EleccionAvatar } from '../lib/avatares'
import { api } from './cliente'

export type DatosUsuario = {
  id: number
  username: string
  nombre: string
  correo: string
  rol: 'admin' | 'usuario'
  estado: 'pendiente' | 'aprobado' | 'bloqueado'
  fechaRegistro: string
  ultimoLogin: string | null
  avatar: string | null
}

export type Estadisticas = {
  quinielasJugadas: number
  puntosTotales: number
  exactosTotales: number
  quinielasGanadas: number
  premiosGanados: number
}

export type Historial = {
  idQuiniela: number
  folio: number
  numero: number
  idJornada: number
  jornada: string
  estadoJornada: 'borrador' | 'abierta' | 'cerrada' | 'finalizada'
  posicion: number
  participantes: number
  puntos: number
  exactos: number
  ganador: boolean
  premio: number | null
}

export type Perfil = { usuario: DatosUsuario; estadisticas: Estadisticas; historial: Historial[] }

export type UsuarioAdmin = {
  id: number
  username: string
  nombre: string
  correo: string
  rol: 'admin' | 'usuario'
  estado: DatosUsuario['estado']
  fechaRegistro: string
  aprobadoAt: string | null
  ultimoLogin: string | null
  avatar: string | null
}

export type Pagina<T> = { elementos: T[]; pagina: number; tamano: number; total: number; totalPaginas: number }

export const perfilApi = {
  ver: () => api<Perfil>('/api/perfil'),
  cambiarNombre: (nombre: string) => api<Perfil>('/api/perfil', { metodo: 'PUT', cuerpo: { nombre } }),
  /** Guarda lo que eligió en el selector: foto, avatar predefinido o iniciales. */
  guardarAvatar: (e: Exclude<EleccionAvatar, null>) => {
    if (e.tipo === 'foto') {
      const datos = new FormData()
      datos.append('archivo', e.archivo)
      return api<Perfil>('/api/perfil/avatar', { metodo: 'POST', cuerpo: datos })
    }
    if (e.tipo === 'preset') return api<Perfil>('/api/perfil/avatar', { metodo: 'PUT', cuerpo: { preset: e.preset } })
    return api<Perfil>('/api/perfil/avatar', { metodo: 'DELETE' })
  },
}

export const usuariosApi = {
  listar: (estado: DatosUsuario['estado'] | undefined, q: string, pagina = 0) => {
    const p = new URLSearchParams({ pagina: String(pagina), tamano: '30' })
    if (estado) p.set('estado', estado)
    if (q.trim()) p.set('q', q.trim())
    return api<Pagina<UsuarioAdmin>>(`/api/admin/usuarios?${p}`)
  },
  conteos: () => api<Record<DatosUsuario['estado'], number>>('/api/admin/usuarios/conteos'),
  detalle: (id: number) => api<Perfil>(`/api/admin/usuarios/${id}`),
  editar: (id: number, nombre: string, correo: string) =>
    api<Perfil>(`/api/admin/usuarios/${id}`, { metodo: 'PUT', cuerpo: { nombre, correo } }),
  eliminar: (id: number) => api<void>(`/api/admin/usuarios/${id}`, { metodo: 'DELETE' }),
  accion: (id: number, accion: 'aprobar' | 'bloquear' | 'desbloquear') =>
    api<UsuarioAdmin>(`/api/admin/usuarios/${id}/${accion}`, { metodo: 'PUT' }),
}
