import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'

import { usuariosApi, type DatosUsuario, type Pagina, type UsuarioAdmin } from '../../api/perfil'
import { Alerta } from '../../components/Alerta'
import { Icono } from '../../components/Icono'
import { Avatar, EstadoUsuarioBadge } from '../../components/PerfilPartes'
import { fechaHoraCorta } from '../../lib/fechas'
import { useOperacion } from '../../lib/useOperacion'

type Filtro = DatosUsuario['estado'] | 'todos'

const PESTANAS: { f: Filtro; texto: string }[] = [
  { f: 'pendiente', texto: 'Pendientes' },
  { f: 'aprobado', texto: 'Aprobados' },
  { f: 'bloqueado', texto: 'Bloqueados' },
  { f: 'todos', texto: 'Todos' },
]

/** Lista de usuarios: aprobar registros, bloquear/desbloquear y entrar al detalle. */
export function AdminUsuarios() {
  const [filtro, setFiltro] = useState<Filtro>('pendiente')
  const [q, setQ] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(0)
  const [datos, setDatos] = useState<Pagina<UsuarioAdmin> | null>(null)
  const [conteos, setConteos] = useState<Record<DatosUsuario['estado'], number> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const op = useOperacion()

  // Espera a que deje de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(q)
      setPagina(0)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const cargar = useCallback(async () => {
    try {
      const [lista, c] = await Promise.all([
        usuariosApi.listar(filtro === 'todos' ? undefined : filtro, busqueda, pagina),
        usuariosApi.conteos(),
      ])
      setDatos(lista)
      setConteos(c)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [filtro, busqueda, pagina])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function accion(u: UsuarioAdmin, tipo: 'aprobar' | 'bloquear' | 'desbloquear') {
    if (tipo === 'bloquear' && !window.confirm(`¿Bloquear a @${u.username}? Se cerrarán sus sesiones y no podrá entrar.`)) return
    const textos = { aprobar: 'aprobado', bloquear: 'bloqueado', desbloquear: 'desbloqueado' }
    const r = await op.ejecutar(`${tipo}-${u.id}`, () => usuariosApi.accion(u.id, tipo), `@${u.username} ${textos[tipo]}`)
    if (r) cargar()
  }

  const total = conteos ? conteos.pendiente + conteos.aprobado + conteos.bloqueado : null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Hola, Administrador</p>
        <h1 className="text-4xl leading-tight font-extrabold tracking-tighter italic">
          USUA<span className="text-primary drop-shadow-[0_0_20px_rgba(19,236,91,0.5)]">RIOS</span>
        </h1>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PESTANAS.map((p) => {
          const n = p.f === 'todos' ? total : conteos?.[p.f]
          return (
            <button
              key={p.f}
              type="button"
              onClick={() => {
                op.limpiar()
                setFiltro(p.f)
                setPagina(0)
              }}
              className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-[10px] font-black tracking-wider uppercase transition-colors ${
                filtro === p.f ? 'border-primary bg-primary/15 text-primary' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
              }`}
            >
              <span className={`text-base ${p.f === 'pendiente' && n ? 'text-yellow-300' : ''}`}>{n ?? '–'}</span>
              {p.texto}
            </button>
          )
        })}
      </div>

      <label className="relative flex items-center">
        <Icono nombre="search" className="pointer-events-none absolute left-4 text-white/40" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por usuario, nombre o correo"
          aria-label="Buscar usuarios"
          className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pr-4 pl-12 text-sm outline-none placeholder:text-white/30 focus:border-primary"
        />
      </label>

      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
      {error && <Alerta tipo="error">{error}</Alerta>}

      <section className="glass-card overflow-hidden rounded-2xl">
        {!datos && !error && <p className="px-5 py-8 text-center text-sm text-white/50">Cargando…</p>}
        {datos?.elementos.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-white/50">
            {busqueda ? 'Nadie coincide con la búsqueda.' : filtro === 'pendiente' ? 'No hay registros por aprobar.' : 'No hay usuarios aquí.'}
          </p>
        )}
        <ul className="divide-y divide-white/10">
          {datos?.elementos.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/admin/usuarios/${u.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar nombre={u.nombre} tamano="chico" />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-bold">
                    @{u.username}
                    {u.rol === 'admin' && <span className="text-[9px] font-black text-primary">ADMIN</span>}
                  </p>
                  <p className="truncate text-[11px] text-white/50">
                    {u.nombre} · {u.correo}
                  </p>
                  <p className="text-[10px] text-white/30">Registro {fechaHoraCorta(u.fechaRegistro)}</p>
                </div>
              </Link>
              {filtro === 'todos' && <EstadoUsuarioBadge estado={u.estado} />}
              {u.estado === 'pendiente' && (
                <button
                  type="button"
                  onClick={() => accion(u, 'aprobar')}
                  disabled={op.ocupado !== null}
                  className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[10px] font-black text-fondo uppercase disabled:opacity-40"
                >
                  Aprobar
                </button>
              )}
              {u.estado === 'bloqueado' && (
                <button
                  type="button"
                  onClick={() => accion(u, 'desbloquear')}
                  disabled={op.ocupado !== null}
                  className="shrink-0 rounded-lg border border-primary/40 px-3 py-2 text-[10px] font-black text-primary uppercase disabled:opacity-40"
                >
                  Desbloquear
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {datos && datos.totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <button type="button" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)} className="rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-30">
            Anterior
          </button>
          <span className="text-white/50">
            {pagina + 1} / {datos.totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina + 1 >= datos.totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className="rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
