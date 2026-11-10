import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'

import { jornadasApi, type Equipo, type Jornada, type JornadaDetalle, type Partido } from '../../api/jornadas'
import { Alerta } from '../../components/Alerta'
import { useConfirmar } from '../../components/Confirmar'
import { EquipoChip } from '../../components/EquipoChip'
import { EstadoJornadaBadge } from '../../components/EstadoJornadaBadge'
import { Icono } from '../../components/Icono'
import { SelectorEquipo } from '../../components/SelectorEquipo'
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
  const confirmar = useConfirmar()

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

  // Los errores se muestran arriba: si la acción se lanzó desde abajo (p. ej. Activar jornada), sube para verlos
  useEffect(() => {
    if (op.mensaje?.tipo === 'error') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [op.mensaje])

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

      <DatosJornada
        key={`${j.precio}-${j.pctPremio}`}
        j={j}
        ocupado={op.ocupado === 'datos'}
        onGuardar={(precio, pctPremio) =>
          actualizar('datos', () => jornadasApi.editar(j.id, { precio, pctPremio }), 'Precio y premio actualizados')
        }
      />

      {enBorrador && (
        <NuevoPartido
          equipos={equipos}
          ocupados={ocupados}
          ocupado={op.ocupado === 'nuevo'}
          onAgregar={(d) => actualizar('nuevo', () => jornadasApi.agregarPartido(j.id, d), 'Partido agregado')}
        />
      )}

      <section className="glass-card space-y-6 rounded-2xl p-5">
        {enBorrador && (
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black tracking-widest uppercase">Partidos de la jornada</h2>
            <span className="text-xs font-bold text-primary">{partidos.length}</span>
          </div>
        )}
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
              onQuitar={async () => {
                const ok = await confirmar({
                  titulo: 'Quitar partido',
                  mensaje: <>¿Quitar <strong>{p.local.nombre} vs {p.visitante.nombre}</strong> de la jornada?</>,
                  confirmar: 'Quitar',
                  tono: 'peligro',
                  icono: 'delete',
                })
                if (ok) actualizar(`q-${p.id}`, () => jornadasApi.eliminarPartido(p.id), 'Partido quitado')
              }}
            />
          ) : (
            <PartidoResultado
              key={p.id}
              numero={i + 1}
              partido={p}
              habilitado={capturaResultados}
              ocupado={op.ocupado === `r-${p.id}` || op.ocupado === `s-${p.id}` || op.ocupado === `a-${p.id}`}
              onReactivar={
                j.estado === 'finalizada'
                  ? undefined
                  : async () => {
                      const ok = await confirmar({
                        titulo: 'Reactivar partido',
                        mensaje: <><strong>{p.local.nombre} vs {p.visitante.nombre}</strong> vuelve a contar para puntos y podrás capturar su marcador.</>,
                        confirmar: 'Reactivar',
                        icono: 'restart_alt',
                      })
                      if (ok) actualizar(`a-${p.id}`, () => jornadasApi.reactivar(p.id), 'Partido reactivado')
                    }
              }
              edicion={
                j.estado === 'finalizada'
                  ? undefined
                  : {
                      equipos,
                      ocupados,
                      soloFecha: !j.aceptaPronosticos,
                      ocupado: op.ocupado === `p-${p.id}`,
                      onGuardar: async (d) => {
                        const cambianEquipos = d.idLocal !== p.local.id || d.idVisitante !== p.visitante.id
                        if (cambianEquipos && j.totalQuinielas > 0) {
                          const ok = await confirmar({
                            titulo: 'Cambiar equipos',
                            mensaje: (
                              <>
                                Ya hay <strong>{j.totalQuinielas}</strong> {j.totalQuinielas === 1 ? 'quiniela' : 'quinielas'} en esta jornada. Sus
                                pronósticos de este partido se conservan; avisa a los jugadores para que los revisen.
                              </>
                            ),
                            confirmar: 'Cambiar',
                            icono: 'swap_horiz',
                          })
                          if (!ok) return undefined
                        }
                        return actualizar(`p-${p.id}`, () => jornadasApi.editarPartido(p.id, d), 'Partido actualizado')
                      },
                    }
              }
              onGuardar={(gl, gv) =>
                actualizar(
                  `r-${p.id}`,
                  () => jornadasApi.resultado(p.id, gl, gv),
                  p.estado === 'finalizado' ? 'Marcador corregido; el ranking ya se actualizó' : 'Partido finalizado; el ranking ya se actualizó',
                )
              }
              onSuspender={async () => {
                const ok = await confirmar({
                  titulo: 'Suspender partido',
                  mensaje: <><strong>{p.local.nombre} vs {p.visitante.nombre}</strong> no contará para puntos.</>,
                  confirmar: 'Suspender',
                  tono: 'peligro',
                  icono: 'block',
                })
                if (ok) actualizar(`s-${p.id}`, () => jornadasApi.suspender(p.id), 'Partido suspendido')
              }}
            />
          ),
        )}
      </section>

      {enBorrador && partidos.length > 0 && (
        <button
          type="button"
          disabled={op.ocupado !== null}
          onClick={async () => {
            const ok = await confirmar({
              titulo: 'Activar jornada',
              mensaje: (
                <>
                  Los jugadores podrán capturar quinielas de <strong>{j.nombre}</strong> hasta que empiece el primer
                  partido. Después ya no podrás cambiar los partidos.
                </>
              ),
              confirmar: 'Activar',
              icono: 'play_circle',
            })
            if (ok) actualizar('abrir', () => jornadasApi.accion(j.id, 'abrir'), `${j.nombre} abierta: ya se pueden capturar pronósticos`)
          }}
          className="w-full rounded-2xl bg-primary py-5 text-lg font-black tracking-widest text-fondo uppercase shadow-[0_0_25px_rgba(19,236,91,0.5)] transition-all active:scale-[0.97] disabled:opacity-50"
        >
          Activar jornada
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- datos de la jornada

/** Precio por quiniela y % a premios. Se pueden corregir hasta finalizar (el precio, mientras nadie haya pagado). */
function DatosJornada(props: { j: Jornada; ocupado: boolean; onGuardar: (precio: number, pct: number) => Promise<unknown> }) {
  const { j } = props
  const [editando, setEditando] = useState(false)
  const [precio, setPrecio] = useState(String(j.precio))
  const [pct, setPct] = useState(String(j.pctPremio))
  const editable = j.estado !== 'finalizada'
  const valido = Number(precio) >= 1 && pct !== '' && Number(pct) >= 0 && Number(pct) <= 100
  const campo =
    'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valido) return
    if (await props.onGuardar(Number(precio), Number(pct))) setEditando(false)
  }

  if (!editando) {
    return (
      <section className="glass-card flex items-center gap-4 rounded-2xl px-5 py-4">
        <div className="flex flex-1 gap-6">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.15em] text-white/50 uppercase">Precio</p>
            <p className="text-lg font-black">${j.precio}</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.15em] text-white/50 uppercase">A premios</p>
            <p className="text-lg font-black">{j.pctPremio}%</p>
          </div>
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-[11px] font-black tracking-wider text-primary uppercase hover:bg-primary/20"
          >
            <Icono nombre="edit" className="text-base!" /> Editar
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="glass-card space-y-4 rounded-2xl p-5">
      <form onSubmit={onSubmit} className="space-y-4">
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
        {j.estado !== 'borrador' && (
          <p className="ml-1 text-xs text-white/40">
            Las quinielas que aún no pagan toman el precio nuevo. Si alguien ya pagó o mandó comprobante, el precio ya no se puede cambiar.
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPrecio(String(j.precio))
              setPct(String(j.pctPremio))
              setEditando(false)
            }}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 text-xs font-black tracking-widest text-white/80 uppercase"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!valido || props.ocupado}
            className="flex-1 rounded-xl bg-primary py-3 text-xs font-black tracking-widest text-fondo uppercase disabled:opacity-50"
          >
            {props.ocupado ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </section>
  )
}

// ---------------------------------------------------------------- borrador

type DatosPartido = { idLocal: number; idVisitante: number; fechaHora: string }

const SELECT =
  'h-14 w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary'

function FormPartido(props: {
  inicial?: Partido
  equipos: Equipo[]
  ocupados: Set<number>
  ocupado: boolean
  textoBoton: string
  onEnviar: (d: DatosPartido) => Promise<unknown>
  limpiarAlEnviar?: boolean
  /** Con la jornada ya sin pronósticos solo se puede mover la fecha. */
  soloFecha?: boolean
  onCancelar?: () => void
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
        <div className="min-w-0 flex-1">
          <SelectorEquipo valor={local} equipos={props.equipos} yaJuegan={bloqueados} deshabilitados={new Set([...bloqueados, ...(visita ? [visita] : [])])} placeholder="Local" bloqueado={props.soloFecha} onCambio={setLocal} />
        </div>
        <span className="text-xs font-black text-primary italic">VS</span>
        <div className="min-w-0 flex-1">
          <SelectorEquipo valor={visita} equipos={props.equipos} yaJuegan={bloqueados} deshabilitados={new Set([...bloqueados, ...(local ? [local] : [])])} placeholder="Visitante" alinear="der" bloqueado={props.soloFecha} onCambio={setVisita} />
        </div>
      </div>
      {props.soloFecha && <p className="ml-1 text-xs text-white/40">La jornada ya no recibe pronósticos: solo puedes mover la fecha.</p>}
      <div className="flex gap-2">
        <input
          type="datetime-local"
          aria-label="Fecha y hora del partido"
          className={`${SELECT} flex-1 scheme-dark`}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        {props.onCancelar && (
          <button
            type="button"
            onClick={props.onCancelar}
            className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-black tracking-wider text-white/70 uppercase hover:border-white/40"
          >
            Cancelar
          </button>
        )}
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
  return (
    <section className="glass-card relative z-20 space-y-4 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Icono nombre="add_circle" className="text-primary" />
        <h2 className="text-sm font-black tracking-widest uppercase">Crear partido</h2>
      </div>
      <FormPartido equipos={props.equipos} ocupados={props.ocupados} ocupado={props.ocupado} textoBoton="Añadir" onEnviar={props.onAgregar} limpiarAlEnviar />
    </section>
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
  /** Deshace la suspensión (solo si la jornada no está finalizada). */
  onReactivar?: () => void
  /** Corrección del partido (equipos y fecha) con la jornada activa o cerrada. */
  edicion?: {
    equipos: Equipo[]
    ocupados: Set<number>
    soloFecha: boolean
    ocupado: boolean
    onGuardar: (d: DatosPartido) => Promise<unknown>
  }
}) {
  const p = props.partido
  const [editando, setEditando] = useState(false)
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

  const puedeEditar = !!props.edicion && p.estado === 'programado'

  if (editando && props.edicion) {
    const e = props.edicion
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Editar partido {props.numero}</span>
        </div>
        <FormPartido
          inicial={p}
          equipos={e.equipos}
          ocupados={e.ocupados}
          ocupado={e.ocupado}
          soloFecha={e.soloFecha}
          textoBoton="Guardar"
          onCancelar={() => setEditando(false)}
          onEnviar={async (d) => {
            const r = await e.onGuardar(d)
            if (r) setEditando(false)
            return r
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Partido {props.numero}</span>
        <div className="flex items-center gap-3">
          {suspendido && props.onReactivar && (
            <button
              type="button"
              onClick={props.onReactivar}
              disabled={props.ocupado}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-black tracking-wider text-primary uppercase hover:bg-primary/20 disabled:opacity-40"
            >
              <Icono nombre="restart_alt" className="text-sm!" /> Reactivar
            </button>
          )}
          <span className="text-[10px] font-bold text-white/40 uppercase">
            {suspendido ? 'Suspendido' : finalizado ? 'Final' : fechaHoraCorta(p.fechaHora)}
          </span>
          {puedeEditar && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-black tracking-wider text-primary uppercase hover:bg-primary/20"
            >
              <Icono nombre="edit" className="text-sm!" /> Editar
            </button>
          )}
        </div>
      </div>
      <div className={`flex items-center gap-2 ${suspendido ? 'opacity-50' : ''}`}>
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
