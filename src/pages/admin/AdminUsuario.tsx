import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { usuariosApi, type Perfil } from '../../api/perfil'
import { useAuth } from '../../auth/AuthContext'
import { Alerta } from '../../components/Alerta'
import { confirmarBloqueo, useConfirmar } from '../../components/Confirmar'
import { BotonPrimario } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { Icono } from '../../components/Icono'
import { Avatar } from '../../components/Avatar'
import { EstadoUsuarioBadge, ListaHistorial, TarjetasEstadisticas } from '../../components/PerfilPartes'
import { fechaHoraCorta } from '../../lib/fechas'
import { useOperacion } from '../../lib/useOperacion'

/** Pantalla 2 (vista admin): editar nombre y correo, cambiar estado y eliminar al usuario. */
export function AdminUsuario() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { usuario: yo } = useAuth()
  const [datos, setDatos] = useState<Perfil | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const op = useOperacion()
  const confirmar = useConfirmar()

  useEffect(() => {
    let vivo = true
    usuariosApi
      .detalle(Number(id))
      .then((p) => {
        if (!vivo) return
        setDatos(p)
        setNombre(p.usuario.nombre)
        setCorreo(p.usuario.correo)
      })
      .catch((e: Error) => vivo && setError(e.message))
    return () => {
      vivo = false
    }
  }, [id])

  if (error) {
    return (
      <div className="space-y-4">
        <Alerta tipo="error">{error}</Alerta>
        <Link to="/admin/usuarios" className="text-sm text-primary hover:underline">
          ← Volver a usuarios
        </Link>
      </div>
    )
  }
  if (!datos) return <p className="text-center text-sm text-white/50">Cargando…</p>

  const u = datos.usuario
  const esYo = yo?.id === u.id
  const protegido = esYo || u.rol === 'admin'
  const cambios = nombre.trim() !== u.nombre || correo.trim().toLowerCase() !== u.correo.toLowerCase()

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const r = await op.ejecutar('guardar', () => usuariosApi.editar(u.id, nombre.trim(), correo.trim()), 'Cambios guardados')
    if (r) {
      setDatos(r)
      setNombre(r.usuario.nombre)
      setCorreo(r.usuario.correo)
    }
  }

  async function estado(tipo: 'aprobar' | 'bloquear' | 'desbloquear') {
    if (tipo === 'bloquear' && !(await confirmar(confirmarBloqueo(u.username)))) return
    const r = await op.ejecutar(tipo, () => usuariosApi.accion(u.id, tipo), 'Estado actualizado')
    if (r) setDatos((d) => d && { ...d, usuario: { ...d.usuario, estado: r.estado } })
  }

  async function eliminar() {
    if (
      !(await confirmar({
        titulo: 'Eliminar usuario',
        mensaje: (
          <>
            <strong>@{u.username}</strong> ya no podrá entrar ni aparecerá en la lista. Sus quinielas y lugares en el
            ranking se conservan. No se puede deshacer desde la app.
          </>
        ),
        confirmar: 'Eliminar',
        tono: 'peligro',
        icono: 'person_remove',
      }))
    )
      return
    const ok = await op.ejecutar('eliminar', async () => {
      await usuariosApi.eliminar(u.id)
      return true
    })
    if (ok) navegar('/admin/usuarios', { replace: true })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/admin/usuarios" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:border-primary">
          <Icono nombre="arrow_back" />
        </Link>
        <span className="rounded-full border border-primary/30 px-3 py-1 text-xs font-black tracking-[0.2em] text-primary">ADMIN</span>
      </div>

      <h1 className="text-center text-4xl leading-none font-extrabold tracking-tighter italic drop-shadow-[0_0_30px_rgba(19,236,91,0.3)]">
        ADMINISTRAR <br />
        <span className="text-primary">USUARIO</span>
      </h1>

      <section className="glass-card space-y-6 rounded-[2.5rem] p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar nombre={u.nombre} avatar={u.avatar} />
          <p className="mt-2 text-xl font-extrabold">@{u.username}</p>
          <div className="flex items-center gap-2">
            <EstadoUsuarioBadge estado={u.estado} />
            {u.rol === 'admin' && <span className="text-[10px] font-black tracking-widest text-primary">ADMIN</span>}
          </div>
        </div>

        <form onSubmit={guardar} className="space-y-4">
          <Campo etiqueta="Nombre completo" icono="badge" value={nombre} maxLength={100} required onChange={(e) => setNombre(e.target.value)} />
          <Campo etiqueta="Correo electrónico" icono="mail" type="email" value={correo} maxLength={254} required onChange={(e) => setCorreo(e.target.value)} />
          {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
          <BotonPrimario disabled={op.ocupado !== null || !cambios}>{op.ocupado === 'guardar' ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}</BotonPrimario>
        </form>

        {!protegido && (
          <div className="space-y-3 border-t border-white/10 pt-5">
            {u.estado === 'pendiente' && (
              <button type="button" onClick={() => estado('aprobar')} disabled={op.ocupado !== null} className="w-full rounded-xl border border-primary/40 bg-primary/10 py-3.5 text-sm font-extrabold tracking-widest text-primary uppercase disabled:opacity-40">
                Aprobar registro
              </button>
            )}
            {u.estado === 'bloqueado' ? (
              <button type="button" onClick={() => estado('desbloquear')} disabled={op.ocupado !== null} className="w-full rounded-xl border border-primary/40 py-3.5 text-sm font-extrabold tracking-widest text-primary uppercase disabled:opacity-40">
                Desbloquear
              </button>
            ) : (
              <button type="button" onClick={() => estado('bloquear')} disabled={op.ocupado !== null} className="w-full rounded-xl border border-yellow-300/30 py-3.5 text-sm font-extrabold tracking-widest text-yellow-200 uppercase disabled:opacity-40">
                Bloquear
              </button>
            )}
            <button type="button" onClick={eliminar} disabled={op.ocupado !== null} className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-4 text-sm font-extrabold tracking-widest text-red-400 uppercase active:scale-95 disabled:opacity-40">
              Eliminar usuario
            </button>
          </div>
        )}
        {protegido && (
          <p className="text-center text-[11px] text-white/40">
            {esYo ? 'Esta es tu cuenta: no puedes bloquearla ni eliminarla.' : 'Los administradores no se pueden bloquear ni eliminar desde aquí.'}
          </p>
        )}
      </section>

      <TarjetasEstadisticas e={datos.estadisticas} />
      <ListaHistorial h={datos.historial} enlazar />

      <p className="pb-4 text-center text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
        Registro {fechaHoraCorta(u.fechaRegistro)} · Último acceso {u.ultimoLogin ? fechaHoraCorta(u.ultimoLogin) : 'nunca'}
      </p>
    </div>
  )
}
