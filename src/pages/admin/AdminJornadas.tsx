import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { jornadasApi, type Jornada, type ListaJornadas } from '../../api/jornadas'
import { ESTADOS_TORNEO, torneosApi, type Torneo } from '../../api/torneos'
import { Alerta } from '../../components/Alerta'
import { BotonPrimario } from '../../components/Boton'
import { useConfirmar, type OpcionesConfirmar } from '../../components/Confirmar'
import { EstadoJornadaBadge } from '../../components/EstadoJornadaBadge'
import { Icono } from '../../components/Icono'
import { fechaHoraCorta } from '../../lib/fechas'
import { useOperacion } from '../../lib/useOperacion'

/** Pantalla 4: Gestión de Jornadas (admin). Las jornadas cuelgan de un torneo (?torneo=id; por defecto el en curso). */
export function AdminJornadas() {
  const [params, setParams] = useSearchParams()
  const idTorneo = Number(params.get('torneo')) || undefined
  const [datos, setDatos] = useState<ListaJornadas | null>(null)
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const op = useOperacion()
  const confirmar = useConfirmar()

  const cargar = useCallback(async () => {
    try {
      setDatos(await jornadasApi.listar(idTorneo))
      setErrorCarga(null)
    } catch (e) {
      setErrorCarga((e as Error).message)
    }
  }, [idTorneo])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    torneosApi
      .listar()
      .then(setTorneos)
      .catch(() => {})
  }, [])

  async function renombrar(j: Jornada, nombre: string) {
    const r = await op.ejecutar(`renombrar-${j.id}`, () => jornadasApi.renombrar(j.id, nombre), 'Nombre actualizado')
    if (r) cargar()
    return !!r
  }

  async function accion(j: Jornada, tipo: 'abrir' | 'cerrar' | 'finalizar' | 'ocultar' | 'mostrar' | 'eliminar') {
    const nombre = <strong>{j.nombre}</strong>
    const confirmaciones: Partial<Record<typeof tipo, OpcionesConfirmar>> = {
      abrir: {
        titulo: 'Activar jornada',
        mensaje: <>Los jugadores podrán capturar quinielas de {nombre} hasta que empiece el primer partido.</>,
        confirmar: 'Activar',
        icono: 'play_circle',
      },
      cerrar: {
        titulo: 'Cerrar jornada',
        mensaje: <>Ya no se aceptarán más pronósticos en {nombre}.</>,
        confirmar: 'Cerrar',
        tono: 'peligro',
        icono: 'cancel',
      },
      finalizar: {
        titulo: 'Finalizar jornada',
        mensaje: <>El ranking de {nombre} quedará definitivo y ya no se podrán corregir marcadores ni validar pagos.</>,
        confirmar: 'Finalizar',
        tono: 'peligro',
        icono: 'flag',
      },
      eliminar: {
        titulo: 'Eliminar jornada',
        mensaje: <>Se borrarán {nombre} y sus partidos. No se puede deshacer.</>,
        confirmar: 'Eliminar',
        tono: 'peligro',
        icono: 'delete',
      },
    }
    const pregunta = confirmaciones[tipo]
    if (pregunta && !(await confirmar(pregunta))) return

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

      <section className="glass-card space-y-3 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">Torneo</span>
          <Link
            to="/admin/torneos"
            className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-[11px] font-black tracking-wider text-primary uppercase transition-colors hover:bg-primary/20"
          >
            <Icono nombre="emoji_events" className="text-base!" /> Administrar torneos
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
          <select
            aria-label="Torneo"
            value={datos?.idTemporada ?? ''}
            onChange={(e) => {
              op.limpiar()
              setParams({ torneo: e.target.value }, { replace: true })
            }}
            className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/40 pr-10 pl-4 text-sm font-bold text-white transition-colors outline-none hover:border-white/30 focus:border-primary focus:ring-1 focus:ring-primary [&>option]:bg-[#0d1611]"
          >
            {datos && !torneos.some((t) => t.id === datos.idTemporada) && <option value={datos.idTemporada}>{datos.temporada}</option>}
            {torneos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} · {ESTADOS_TORNEO[t.estado].texto}
              </option>
            ))}
          </select>
          <Icono nombre="expand_more" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xl! text-primary" />
          </div>
          {datos && (
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${ESTADOS_TORNEO[datos.estadoTemporada].clase}`}>
              {ESTADOS_TORNEO[datos.estadoTemporada].texto}
            </span>
          )}
        </div>
        {datos?.estadoTemporada === 'proximo' && (
          <p className="text-xs text-white/50">Puedes preparar jornadas; se podrán activar cuando inicies el torneo.</p>
        )}
      </section>

      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

      {datos?.estadoTemporada === 'finalizado' ? (
        <Alerta tipo="aviso">El torneo {datos.temporada} está finalizado: ya no acepta jornadas nuevas.</Alerta>
      ) : (
        datos && (
          <CrearJornada
            key={datos.idTemporada}
            idTemporada={datos.idTemporada}
            siguiente={(datos.jornadas[0]?.numero ?? 0) + 1}
            onCreada={() => cargar()}
          />
        )
      )}

      <section className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-black tracking-widest uppercase">Listado de jornadas</h2>
          {datos && <span className="text-xs font-bold text-primary">{datos.jornadas.length}</span>}
        </div>

        {!datos && !errorCarga && <p className="px-5 py-8 text-center text-sm text-white/50">Cargando…</p>}
        {datos?.jornadas.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-white/50">Todavía no hay jornadas. Crea la primera arriba.</p>
        )}

        <ul className="divide-y divide-white/10">
          {datos?.jornadas.map((j) => (
            <FilaJornada
              key={j.id}
              j={j}
              ocupado={op.ocupado}
              onAccion={(t) => accion(j, t)}
              onRenombrar={(n) => renombrar(j, n)}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

type Accion = 'abrir' | 'cerrar' | 'finalizar' | 'ocultar' | 'mostrar' | 'eliminar'

function FilaJornada(props: {
  j: Jornada
  ocupado: string | null
  onAccion: (a: Accion) => void
  onRenombrar: (nombre: string) => Promise<boolean>
}) {
  const { j, ocupado, onAccion } = props
  const ocupada = ocupado?.endsWith(`-${j.id}`) ?? false
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(j.nombre)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    if (nombre.trim() === j.nombre || (await props.onRenombrar(nombre.trim()))) setEditando(false)
  }

  if (editando) {
    return (
      <li className="px-5 py-4">
        <form onSubmit={guardar} className="space-y-3">
          <label className="block space-y-2">
            <span className="ml-1 text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">Nombre de la J{j.numero}</span>
            <input
              autoFocus
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setNombre(j.nombre)
                setEditando(false)
              }}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-black tracking-widest text-white/80 uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={ocupada || !nombre.trim()}
              className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black tracking-widest text-fondo uppercase disabled:opacity-50"
            >
              {ocupada ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </li>
    )
  }
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
        <BotonAccion
          icono="edit"
          texto="Nombre"
          onClick={() => {
            setNombre(j.nombre)
            setEditando(true)
          }}
          disabled={ocupada}
        />
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

function CrearJornada({ idTemporada, siguiente, onCreada }: { idTemporada: number; siguiente: number; onCreada: () => void }) {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('50')
  const [pct, setPct] = useState('80')
  const op = useOperacion()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const r = await op.ejecutar(
      'crear',
      () => jornadasApi.crear({ idTemporada, nombre: nombre.trim() || undefined, precio: Number(precio), pctPremio: Number(pct) }),
      'Jornada creada. Ahora agrégale partidos.',
    )
    if (r) {
      setNombre('')
      onCreada()
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
