import { useEffect, useState, type FormEvent } from 'react'

import { perfilApi, type Perfil as PerfilDatos } from '../api/perfil'
import { useAuth } from '../auth/AuthContext'
import { passwordValida } from '../auth/password'
import { Alerta } from '../components/Alerta'
import { BotonPrimario } from '../components/Boton'
import { Campo } from '../components/Campo'
import { Icono } from '../components/Icono'
import { Avatar } from '../components/Avatar'
import { EstadoUsuarioBadge, ListaHistorial, TarjetasEstadisticas } from '../components/PerfilPartes'
import { ReglasPassword } from '../components/ReglasPassword'
import { SelectorAvatar } from '../components/SelectorAvatar'
import type { EleccionAvatar } from '../lib/avatares'
import { fechaHoraCorta } from '../lib/fechas'
import { useOperacion } from '../lib/useOperacion'

/** Pantalla 2: mi perfil (datos, estadísticas, historial, cambio de contraseña). */
export function Perfil() {
  const { salir, actualizarUsuario } = useAuth()
  const [datos, setDatos] = useState<PerfilDatos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const op = useOperacion()
  const opAvatar = useOperacion()
  const [editandoAvatar, setEditandoAvatar] = useState(false)
  const [eleccion, setEleccion] = useState<EleccionAvatar>(null)

  useEffect(() => {
    let vivo = true
    perfilApi
      .ver()
      .then((p) => {
        if (!vivo) return
        setDatos(p)
        setNombre(p.usuario.nombre)
      })
      .catch((e: Error) => vivo && setError(e.message))
    return () => {
      vivo = false
    }
  }, [])

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const r = await op.ejecutar('nombre', () => perfilApi.cambiarNombre(nombre.trim()), 'Cambios guardados')
    if (r) {
      setDatos(r)
      actualizarUsuario({ nombre: r.usuario.nombre })
    }
  }

  async function guardarAvatar() {
    if (!eleccion) return
    const r = await opAvatar.ejecutar('avatar', () => perfilApi.guardarAvatar(eleccion))
    if (r) {
      setDatos(r)
      actualizarUsuario({ avatar: r.usuario.avatar })
      setEleccion(null)
      setEditandoAvatar(false)
    }
  }

  if (error) return <Alerta tipo="error">{error}</Alerta>
  if (!datos) return <p className="text-center text-sm text-white/50">Cargando…</p>
  const u = datos.usuario

  return (
    <div className="space-y-8">
      <h1 className="text-center text-4xl leading-none font-extrabold tracking-tighter italic drop-shadow-[0_0_30px_rgba(19,236,91,0.3)]">
        MI <span className="text-primary">PERFIL</span>
      </h1>

      <section className="glass-card space-y-6 rounded-[2.5rem] p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={() => {
              setEleccion(null)
              setEditandoAvatar((v) => !v)
            }}
            className="group relative rounded-full"
            aria-label="Cambiar avatar"
          >
            <Avatar nombre={u.nombre} avatar={u.avatar} />
            <span className="absolute right-0 bottom-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-fondo bg-primary text-fondo shadow-lg transition-transform group-hover:scale-110">
              <Icono nombre="photo_camera" className="text-lg!" />
            </span>
          </button>
          <p className="mt-2 text-xl font-extrabold">@{u.username}</p>
          <div className="flex items-center gap-2">
            <EstadoUsuarioBadge estado={u.estado} />
            {u.rol === 'admin' && (
              <span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-primary">ADMIN</span>
            )}
          </div>
          <p className="text-[11px] text-white/40">Tu usuario es el nombre que aparece en el ranking y no se puede cambiar.</p>
        </div>

        {editandoAvatar && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">Tu avatar</p>
            <SelectorAvatar
              nombre={u.nombre}
              actual={u.avatar}
              eleccion={eleccion}
              onElegir={setEleccion}
              permitirQuitar
              ocupado={opAvatar.ocupado !== null}
            />
            {opAvatar.mensaje && <Alerta tipo={opAvatar.mensaje.tipo}>{opAvatar.mensaje.texto}</Alerta>}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditandoAvatar(false)}
                className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs font-black tracking-widest text-white/80 uppercase hover:border-white/40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarAvatar}
                disabled={eleccion === null || opAvatar.ocupado !== null}
                className="rounded-xl bg-primary py-3 text-xs font-black tracking-widest text-fondo uppercase disabled:opacity-40"
              >
                {opAvatar.ocupado ? 'Guardando…' : 'Guardar avatar'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={guardar} className="space-y-4">
          <Campo etiqueta="Nombre completo" icono="badge" value={nombre} maxLength={100} required onChange={(e) => setNombre(e.target.value)} />
          <Campo etiqueta="Correo electrónico" icono="mail" value={u.correo} readOnly disabled />
          {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
          <BotonPrimario disabled={op.ocupado !== null || nombre.trim() === '' || nombre.trim() === u.nombre}>
            {op.ocupado ? 'GUARDANDO…' : 'GUARDAR CAMBIOS'}
          </BotonPrimario>
          <p className="text-center text-[11px] text-white/40">¿Necesitas cambiar tu correo? Pídeselo al administrador.</p>
        </form>
      </section>

      <TarjetasEstadisticas e={datos.estadisticas} />
      <ListaHistorial h={datos.historial} enlazar />
      <CambiarPassword />

      <div className="space-y-3 pb-4 text-center">
        <button
          type="button"
          onClick={salir}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white/80 hover:border-red-400/60 hover:text-red-300"
        >
          <Icono nombre="logout" className="text-lg!" /> Cerrar sesión
        </button>
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
          Miembro desde {fechaHoraCorta(u.fechaRegistro).split(',')[0]}
        </p>
      </div>
    </div>
  )
}

function CambiarPassword() {
  const { cambiarPassword } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const op = useOperacion()

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (nueva !== confirmacion) return op.error('Las contraseñas nuevas no coinciden')
    const ok = await op.ejecutar(
      'password',
      async () => {
        await cambiarPassword(actual, nueva, confirmacion)
        return true
      },
      'Contraseña actualizada. Cerramos tus sesiones en otros dispositivos.',
    )
    if (ok) {
      setActual('')
      setNueva('')
      setConfirmacion('')
    }
  }

  return (
    <section className="glass-card rounded-2xl">
      <button type="button" onClick={() => setAbierto((a) => !a)} className="flex w-full items-center gap-3 px-5 py-4 text-left" aria-expanded={abierto}>
        <Icono nombre="lock_reset" className="text-primary" />
        <span className="flex-1 text-sm font-bold">Cambiar contraseña</span>
        <Icono nombre={abierto ? 'expand_less' : 'expand_more'} className="text-white/40" />
      </button>
      {abierto && (
        <form onSubmit={enviar} className="space-y-4 border-t border-white/10 p-5">
          {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
          {
            <>
              <Campo etiqueta="Contraseña actual" icono="lock" type="password" autoComplete="current-password" required value={actual} onChange={(e) => setActual(e.target.value)} />
              <Campo etiqueta="Nueva contraseña" icono="key" type="password" autoComplete="new-password" required value={nueva} onChange={(e) => setNueva(e.target.value)} />
              <ReglasPassword password={nueva} />
              <Campo
                etiqueta="Confirmar nueva contraseña"
                icono="key"
                type="password"
                autoComplete="new-password"
                required
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                error={confirmacion && nueva !== confirmacion ? 'No coincide' : undefined}
              />
              <BotonPrimario disabled={op.ocupado !== null || !actual || !passwordValida(nueva) || nueva !== confirmacion}>
                {op.ocupado ? 'GUARDANDO…' : 'CAMBIAR CONTRASEÑA'}
              </BotonPrimario>
            </>
          }
        </form>
      )}
    </section>
  )
}
