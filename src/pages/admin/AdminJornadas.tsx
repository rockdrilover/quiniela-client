import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { jornadasApi, type Jornada, type ListaJornadas } from '../../api/jornadas'
import { Alerta } from '../../components/Alerta'
import { BotonPrimario } from '../../components/Boton'
import { EstadoJornadaBadge } from '../../components/EstadoJornadaBadge'
import { Icono } from '../../components/Icono'
import { fechaHoraCorta } from '../../lib/fechas'
import { useOperacion } from '../../lib/useOperacion'

/** Pantalla 4: Gestión de Jornadas (admin). */
export function AdminJornadas() {
  const [datos, setDatos] = useState<ListaJornadas | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const op = useOperacion()

  const cargar = useCallback(async () => {
    try {
      setDatos(await jornadasApi.listar())
      setErrorCarga(null)
    } catch (e) {
      setErrorCarga((e as Error).message)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function accion(j: Jornada, tipo: 'abrir' | 'cerrar' | 'finalizar' | 'ocultar' | 'mostrar' | 'eliminar') {
    const confirmaciones: Partial<Record<typeof tipo, string>> = {
      cerrar: `¿Cerrar "${j.nombre}"? Ya no se aceptarán más pronósticos.`,
      finalizar: `¿Finalizar "${j.nombre}"? El ranking quedará definitivo y ya no se podrán corregir marcadores.`,
      eliminar: `¿Eliminar "${j.nombre}" y sus partidos? No se puede deshacer.`,
    }
    if (confirmaciones[tipo] && !window.confirm(confirmaciones[tipo])) return

    const exitos = {
      abrir: `${j.nombre} abierta: ya se pueden capturar pronósticos`,
      cerrar: `${j.nombre} cerrada`,
      finalizar: `${j.nombre} finalizada`,
      ocultar: `${j.nombre} oculta para los usuarios`,
      mostrar: `${j.nombre} visible para los usuarios`,
      eliminar: `${j.nombre} eliminada`,
    }
    const ok = await op.ejecutar(
      `${tipo}-${j.id}`,
      async () => {
        if (tipo === 'eliminar') await jornadasApi.eliminar(j.id)
        else if (tipo === 'ocultar' || tipo === 'mostrar') await jornadasApi.visible(j.id, tipo === 'mostrar')
        else await jornadasApi.accion(j.id, tipo)
        return true
      },
      exitos[tipo],
    )
    if (ok) cargar()
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-white/60">Hola, Administrador</p>
        <h1 className="text-4xl leading-tight font-extrabold tracking-tighter italic">
          GESTIÓN DE <span className="text-primary drop-shadow-[0_0_20px_rgba(19,236,91,0.5)]">JORNADAS</span>
        </h1>
      </div>

      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

      <section className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-black tracking-widest uppercase">Listado de jornadas</h2>
          {datos && <span className="text-xs font-bold text-primary">{datos.temporada}</span>}
        </div>

        {!datos && !errorCarga && <p className="px-5 py-8 text-center text-sm text-white/50">Cargando…</p>}
        {datos?.jornadas.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-white/50">Todavía no hay jornadas. Crea la primera abajo.</p>
        )}

        <ul className="divide-y divide-white/10">
          {datos?.jornadas.map((j) => (
            <FilaJornada key={j.id} j={j} ocupado={op.ocupado} onAccion={(t) => accion(j, t)} />
          ))}
        </ul>
      </section>

      <CrearJornada
        siguiente={(datos?.jornadas[0]?.numero ?? 0) + 1}
        onCreada={(nombre) => {
          cargar()
          return nombre
        }}
      />
    </div>
  )
}

type Accion = 'abrir' | 'cerrar' | 'finalizar' | 'ocultar' | 'mostrar' | 'eliminar'

function FilaJornada({ j, ocupado, onAccion }: { j: Jornada; ocupado: string | null; onAccion: (a: Accion) => void }) {
  const ocupada = ocupado?.endsWith(`-${j.id}`) ?? false
  const puedeAbrir = j.estado === 'borrador' || (j.estado === 'cerrada' && j.estadoVisual === 'CERRADA')
  const puedeCerrar = j.estado === 'abierta'
  const puedeFinalizar = j.estado === 'abierta' || j.estado === 'cerrada'

  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/admin/jornadas/${j.id}`} className="group min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-primary italic">J{j.numero}</span>
            <span className="truncate font-bold group-hover:underline">{j.nombre}</span>
            {!j.visible && <Icono nombre="visibility_off" className="text-base! text-white/40" />}
          </div>
          <p className="mt-0.5 text-xs text-white/50">
            {j.fechaCierre ? `Cierra ${fechaHoraCorta(j.fechaCierre)}` : 'Sin partidos'} · {j.partidosFinalizados}/
            {j.totalPartidos} partidos · {j.totalQuinielas} quinielas · ${j.precio}
          </p>
        </Link>
        <EstadoJornadaBadge estado={j.estadoVisual} />
      </div>

      <div className="flex flex-wrap gap-2">
        <BotonAccion icono="sports_soccer" texto="Partidos" a={`/admin/jornadas/${j.id}`} />
        {puedeAbrir && <BotonAccion icono="play_circle" texto="Activar" tono="verde" onClick={() => onAccion('abrir')} disabled={ocupada} />}
        {puedeCerrar && <BotonAccion icono="cancel" texto="Cerrar" tono="rojo" onClick={() => onAccion('cerrar')} disabled={ocupada} />}
        {puedeFinalizar && <BotonAccion icono="flag" texto="Finalizar" onClick={() => onAccion('finalizar')} disabled={ocupada} />}
        {j.estado !== 'abierta' && j.estado !== 'borrador' &&
          (j.visible ? (
            <BotonAccion icono="visibility_off" texto="Ocultar" onClick={() => onAccion('ocultar')} disabled={ocupada} />
          ) : (
            <BotonAccion icono="visibility" texto="Mostrar" onClick={() => onAccion('mostrar')} disabled={ocupada} />
          ))}
        {j.estado === 'borrador' && j.totalQuinielas === 0 && (
          <BotonAccion icono="delete" texto="Eliminar" tono="rojo" onClick={() => onAccion('eliminar')} disabled={ocupada} />
        )}
      </div>
    </li>
  )
}

const TONOS = {
  neutro: 'border-white/15 bg-white/5 text-white/80 hover:border-white/40',
  verde: 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
  rojo: 'border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
}

function BotonAccion(props: {
  icono: string
  texto: string
  tono?: keyof typeof TONOS
  onClick?: () => void
  disabled?: boolean
  a?: string
}) {
  const clase = `inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-[11px] font-black tracking-wider uppercase transition-colors disabled:opacity-40 ${TONOS[props.tono ?? 'neutro']}`
  const contenido = (
    <>
      <Icono nombre={props.icono} className="text-base!" />
      {props.texto}
    </>
  )
  if (props.a) {
    return (
      <Link to={props.a} className={clase}>
        {contenido}
      </Link>
    )
  }
  return (
    <button type="button" onClick={props.onClick} disabled={props.disabled} className={clase}>
      {contenido}
    </button>
  )
}

function CrearJornada({ siguiente, onCreada }: { siguiente: number; onCreada: (nombre: string) => void }) {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('50')
  const [pct, setPct] = useState('80')
  const op = useOperacion()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const r = await op.ejecutar(
      'crear',
      () => jornadasApi.crear({ nombre: nombre.trim() || undefined, precio: Number(precio), pctPremio: Number(pct) }),
      'Jornada creada. Ahora agrégale partidos.',
    )
    if (r) {
      setNombre('')
      onCreada(r.jornada.nombre)
    }
  }

  const campo =
    'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/25 focus:border-primary focus:ring-1 focus:ring-primary'

  return (
    <section className="glass-card space-y-5 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Icono nombre="add_circle" className="text-primary" />
        <h2 className="text-sm font-black tracking-widest uppercase">Crear nueva jornada</h2>
      </div>
      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="ml-1 text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">Nombre de la jornada</span>
          <input className={campo} placeholder={`Jornada ${siguiente}`} maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="ml-1 text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">Precio ($)</span>
            <input className={campo} type="number" inputMode="decimal" min={1} step="0.01" required value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="ml-1 text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">% a premios</span>
            <input className={campo} type="number" inputMode="numeric" min={0} max={100} required value={pct} onChange={(e) => setPct(e.target.value)} />
          </label>
        </div>
        <p className="ml-1 text-xs text-white/40">
          La fecha de cierre la marca el primer partido: los pronósticos se bloquean cuando empieza.
        </p>
        <BotonPrimario disabled={op.ocupado !== null} className="flex items-center justify-center gap-2">
          {op.ocupado ? 'CREANDO…' : 'CREAR JORNADA'} <Icono nombre="rocket_launch" />
        </BotonPrimario>
      </form>
    </section>
  )
}
