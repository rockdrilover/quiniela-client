import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'

import { jornadasApi, type Equipo, type JornadaDetalle, type Partido } from '../../api/jornadas'
import { Alerta } from '../../components/Alerta'
import { EquipoChip } from '../../components/EquipoChip'
import { EstadoJornadaBadge } from '../../components/EstadoJornadaBadge'
import { Icono } from '../../components/Icono'
import { aInputLocal, deInputLocal, fechaHoraCorta } from '../../lib/fechas'
import { useOperacion } from '../../lib/useOperacion'

/**
 * Pantalla 5: Gestión de Partidos y Resultados (admin).
 *  - En borrador: se arman los partidos (local, visitante, fecha y hora).
 *  - Abierta/cerrada: se capturan los marcadores finales; el ranking se recalcula solo.
 */
export function AdminPartidos() {
  const id = Number(useParams().id)
  const [datos, setDatos] = useState<JornadaDetalle | null>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const op = useOperacion()

  const cargar = useCallback(async () => {
    try {
      const [d, e] = await Promise.all([jornadasApi.detalle(id), jornadasApi.equipos()])
      setDatos(d)
      setEquipos(e)
    } catch (err) {
      setErrorCarga((err as Error).message)
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  /** Ejecuta una acción que devuelve la jornada actualizada. */
  const actualizar = async (clave: string, fn: () => Promise<JornadaDetalle>, exito: string) => {
    const r = await op.ejecutar(clave, fn, exito)
    if (r) setDatos(r)
    return r
  }

  if (errorCarga) {
    return <Alerta tipo="error">{errorCarga}</Alerta>
  }
  if (!datos) return <p className="py-10 text-center text-sm text-white/50">Cargando…</p>

  const { jornada: j, partidos } = datos
  const enBorrador = j.estado === 'borrador'
  const capturaResultados = !enBorrador && j.estado !== 'finalizada' && !j.aceptaPronosticos
  const ocupados = new Set(partidos.flatMap((p) => [p.local.id, p.visitante.id]))

  return (
    <div className="space-y-6">
      <Link to="/admin/jornadas" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-primary">
        <Icono nombre="arrow_back" className="text-lg!" /> Jornadas
      </Link>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold tracking-[0.15em] text-white/60 uppercase">
            {j.nombre} · {j.totalPartidos} partidos · ${j.precio}
          </p>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tighter italic">
            {enBorrador ? 'ORGANIZAR' : 'RESULTADOS'}{' '}
            <span className="text-primary drop-shadow-[0_0_15px_rgba(19,236,91,0.7)]">JORNADA</span>
          </h1>
        </div>
        <EstadoJornadaBadge estado={j.estadoVisual} />
      </div>

      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
      {!enBorrador && j.aceptaPronosticos && (
        <Alerta tipo="aviso">
          La jornada está recibiendo pronósticos. Podrás capturar marcadores cuando la cierres o cuando empiece el primer
          partido ({j.fechaCierre && fechaHoraCorta(j.fechaCierre)}).
        </Alerta>
      )}
      {j.estado === 'finalizada' && <Alerta tipo="exito">Jornada finalizada: los marcadores y el ranking ya son definitivos.</Alerta>}

      <section className="glass-card space-y-6 rounded-2xl p-5">
        {partidos.length === 0 && <p className="text-center text-sm text-white/50">Aún no hay partidos en esta jornada.</p>}

        {partidos.map((p, i) =>
          enBorrador ? (
            <PartidoEditable
              key={p.id}
              numero={i + 1}
              partido={p}
              equipos={equipos}
              ocupados={ocupados}
              ocupado={op.ocupado}
              onGuardar={(d) => actualizar(`p-${p.id}`, () => jornadasApi.editarPartido(p.id, d), 'Partido actualizado')}
              onQuitar={() => {
                if (window.confirm(`¿Quitar ${p.local.nombre} vs ${p.visitante.nombre}?`)) {
                  actualizar(`q-${p.id}`, () => jornadasApi.eliminarPartido(p.id), 'Partido quitado')
                }
              }}
            />
          ) : (
            <PartidoResultado
              key={p.id}
              numero={i + 1}
              partido={p}
              habilitado={capturaResultados}
              ocupado={op.ocupado === `r-${p.id}` || op.ocupado === `s-${p.id}`}
              onGuardar={(gl, gv) =>
                actualizar(
                  `r-${p.id}`,
                  () => jornadasApi.resultado(p.id, gl, gv),
                  p.estado === 'finalizado' ? 'Marcador corregido; el ranking ya se actualizó' : 'Partido finalizado; el ranking ya se actualizó',
                )
              }
              onSuspender={() => {
                if (window.confirm(`¿Suspender ${p.local.nombre} vs ${p.visitante.nombre}? No contará para puntos.`)) {
                  actualizar(`s-${p.id}`, () => jornadasApi.suspender(p.id), 'Partido suspendido')
                }
              }}
            />
          ),
        )}

        {enBorrador && (
          <NuevoPartido
            equipos={equipos}
            ocupados={ocupados}
            ocupado={op.ocupado === 'nuevo'}
            onAgregar={(d) => actualizar('nuevo', () => jornadasApi.agregarPartido(j.id, d), 'Partido agregado')}
          />
        )}
      </section>

      {enBorrador && partidos.length > 0 && (
        <button
          type="button"
          disabled={op.ocupado !== null}
          onClick={() => actualizar('abrir', () => jornadasApi.accion(j.id, 'abrir'), `${j.nombre} abierta: ya se pueden capturar pronósticos`)}
          className="w-full rounded-2xl bg-primary py-5 text-lg font-black tracking-widest text-fondo uppercase shadow-[0_0_25px_rgba(19,236,91,0.5)] transition-all active:scale-[0.97] disabled:opacity-50"
        >
          Activar jornada
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- borrador

type DatosPartido = { idLocal: number; idVisitante: number; fechaHora: string }

const SELECT =
  'h-14 w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary'

function SelectorEquipo(props: {
  valor: number | ''
  equipos: Equipo[]
  deshabilitados: Set<number>
  /** Equipos que ya tienen otro partido en la jornada (se marcan "ya juega"). */
  yaJuegan: Set<number>
  placeholder: string
  onCambio: (id: number) => void
}) {
  return (
    <select
      className={SELECT}
      value={props.valor}
      onChange={(e) => props.onCambio(Number(e.target.value))}
      aria-label={props.placeholder}
    >
      <option value="" disabled className="bg-[#121212]">
        {props.placeholder}
      </option>
      {props.equipos.map((e) => (
        <option key={e.id} value={e.id} disabled={props.deshabilitados.has(e.id)} className="bg-[#121212]">
          {e.nombre}
          {props.yaJuegan.has(e.id) ? ' (ya juega)' : ''}
        </option>
      ))}
    </select>
  )
}

function FormPartido(props: {
  inicial?: Partido
  equipos: Equipo[]
  ocupados: Set<number>
  ocupado: boolean
  textoBoton: string
  onEnviar: (d: DatosPartido) => Promise<unknown>
  limpiarAlEnviar?: boolean
}) {
  const [local, setLocal] = useState<number | ''>(props.inicial?.local.id ?? '')
  const [visita, setVisita] = useState<number | ''>(props.inicial?.visitante.id ?? '')
  const [fecha, setFecha] = useState(props.inicial ? aInputLocal(props.inicial.fechaHora) : '')
  const propios = new Set(props.inicial ? [props.inicial.local.id, props.inicial.visitante.id] : [])
  const bloqueados = new Set([...props.ocupados].filter((x) => !propios.has(x)))

  const cambio =
    props.inicial &&
    (local !== props.inicial.local.id || visita !== props.inicial.visitante.id || fecha !== aInputLocal(props.inicial.fechaHora))
  const completo = local !== '' && visita !== '' && fecha !== '' && local !== visita

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!completo) return
    const r = await props.onEnviar({ idLocal: Number(local), idVisitante: Number(visita), fechaHora: deInputLocal(fecha) })
    if (r && props.limpiarAlEnviar) {
      setLocal('')
      setVisita('')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SelectorEquipo valor={local} equipos={props.equipos} yaJuegan={bloqueados} deshabilitados={new Set([...bloqueados, ...(visita ? [visita] : [])])} placeholder="Local" onCambio={setLocal} />
        </div>
        <span className="text-xs font-black text-primary italic">VS</span>
        <div className="flex-1">
          <SelectorEquipo valor={visita} equipos={props.equipos} yaJuegan={bloqueados} deshabilitados={new Set([...bloqueados, ...(local ? [local] : [])])} placeholder="Visitante" onCambio={setVisita} />
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="datetime-local"
          aria-label="Fecha y hora del partido"
          className={`${SELECT} flex-1 scheme-dark`}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        {(!props.inicial || cambio) && (
          <button
            type="submit"
            disabled={!completo || props.ocupado}
            className="shrink-0 rounded-xl bg-primary px-4 text-xs font-black tracking-wider text-fondo uppercase disabled:opacity-40"
          >
            {props.ocupado ? '…' : props.textoBoton}
          </button>
        )}
      </div>
    </form>
  )
}

function PartidoEditable(props: {
  numero: number
  partido: Partido
  equipos: Equipo[]
  ocupados: Set<number>
  ocupado: string | null
  onGuardar: (d: DatosPartido) => Promise<unknown>
  onQuitar: () => void
}) {
  const p = props.partido
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Partido {props.numero}</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-white/40 uppercase">{fechaHoraCorta(p.fechaHora)}</span>
          <button type="button" onClick={props.onQuitar} disabled={props.ocupado !== null} aria-label="Quitar partido" className="text-white/40 hover:text-red-300">
            <Icono nombre="delete" className="text-lg!" />
          </button>
        </div>
      </div>
      <FormPartido
        key={`${p.local.id}-${p.visitante.id}-${p.fechaHora}`}
        inicial={p}
        equipos={props.equipos}
        ocupados={props.ocupados}
        ocupado={props.ocupado === `p-${p.id}`}
        textoBoton="Guardar"
        onEnviar={props.onGuardar}
      />
    </div>
  )
}

function NuevoPartido(props: {
  equipos: Equipo[]
  ocupados: Set<number>
  ocupado: boolean
  onAgregar: (d: DatosPartido) => Promise<unknown>
}) {
  const [abierto, setAbierto] = useState(false)
  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 py-4 text-[10px] font-black tracking-widest text-white/50 uppercase transition-all hover:bg-white/5"
      >
        <Icono nombre="add_circle" className="text-lg!" /> Añadir partido
      </button>
    )
  }
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-primary/40 p-3">
      <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Nuevo partido</span>
      <FormPartido equipos={props.equipos} ocupados={props.ocupados} ocupado={props.ocupado} textoBoton="Añadir" onEnviar={props.onAgregar} limpiarAlEnviar />
    </div>
  )
}

// ---------------------------------------------------------------- resultados

function PartidoResultado(props: {
  numero: number
  partido: Partido
  habilitado: boolean
  ocupado: boolean
  onGuardar: (gl: number, gv: number) => Promise<unknown>
  onSuspender: () => void
}) {
  const p = props.partido
  const [gl, setGl] = useState(p.golesLocal?.toString() ?? '')
  const [gv, setGv] = useState(p.golesVisitante?.toString() ?? '')
  const finalizado = p.estado === 'finalizado'
  const suspendido = p.estado === 'suspendido'
  const editable = props.habilitado && !suspendido
  const cambio = gl !== (p.golesLocal?.toString() ?? '') || gv !== (p.golesVisitante?.toString() ?? '')
  const listo = gl !== '' && gv !== ''

  // Sin negativos: cualquier cosa que no sea dígito se descarta (máx. 2 cifras)
  const limpiar = (v: string) => v.replace(/\D/g, '').slice(0, 2)

  const golInput = (valor: string, set: (v: string) => void, etiqueta: string) => (
    <input
      inputMode="numeric"
      aria-label={etiqueta}
      disabled={!editable}
      value={valor}
      placeholder="–"
      onChange={(e) => set(limpiar(e.target.value))}
      className="h-14 w-14 rounded-xl border border-white/15 bg-black/50 text-center text-2xl font-black text-white outline-none placeholder:text-white/20 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
    />
  )

  return (
    <div className={`space-y-3 ${suspendido ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Partido {props.numero}</span>
        <span className="text-[10px] font-bold text-white/40 uppercase">
          {suspendido ? 'Suspendido' : finalizado ? 'Final' : fechaHoraCorta(p.fechaHora)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <EquipoChip equipo={p.local} />
        </div>
        {golInput(gl, setGl, `Goles de ${p.local.nombre}`)}
        <span className="text-white/30">–</span>
        {golInput(gv, setGv, `Goles de ${p.visitante.nombre}`)}
        <div className="flex-1">
          <EquipoChip equipo={p.visitante} />
        </div>
      </div>
      {editable && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!listo || (finalizado && !cambio) || props.ocupado}
            onClick={() => props.onGuardar(Number(gl), Number(gv))}
            className="flex-1 rounded-xl bg-primary py-3 text-xs font-black tracking-widest text-fondo uppercase disabled:opacity-40"
          >
            {props.ocupado ? 'Guardando…' : finalizado ? (cambio ? 'Corregir marcador' : 'Finalizado ✓') : 'Finalizar partido'}
          </button>
          {!finalizado && (
            <button
              type="button"
              disabled={props.ocupado}
              onClick={props.onSuspender}
              className="rounded-xl border border-white/15 px-3 text-xs font-bold text-white/60 hover:border-red-400/50 hover:text-red-300"
            >
              Suspender
            </button>
          )}
        </div>
      )}
    </div>
  )
}
