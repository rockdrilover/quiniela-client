import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { ESTADOS_TORNEO, torneosApi, type DatosTorneo, type Torneo } from '../../api/torneos'
import { Alerta } from '../../components/Alerta'
import { useConfirmar } from '../../components/Confirmar'
import { Icono } from '../../components/Icono'
import { useOperacion } from '../../lib/useOperacion'

const CAMPO =
  'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/25 focus:border-primary focus:ring-1 focus:ring-primary'
const ETIQUETA = 'ml-1 text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase'

const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const verFecha = (d: string | null) => (d ? fecha.format(new Date(`${d}T00:00:00Z`)) : null)

/**
 * Torneos (Apertura, Clausura...). Ciclo: próximo → en curso → finalizado. Solo uno en curso a la vez.
 * Un torneo finalizado ya no acepta jornadas nuevas.
 */
export function AdminTorneos() {
  const [torneos, setTorneos] = useState<Torneo[] | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [editando, setEditando] = useState<number | null>(null)
  const op = useOperacion()
  const confirmar = useConfirmar()

  const cargar = useCallback(async () => {
    try {
      setTorneos(await torneosApi.listar())
      setErrorCarga(null)
    } catch (e) {
      setErrorCarga((e as Error).message)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function accion(t: Torneo, tipo: 'iniciar' | 'finalizar' | 'eliminar') {
    const nombre = <strong>{t.nombre}</strong>
    const preguntas = {
      iniciar: {
        titulo: 'Iniciar torneo',
        mensaje: <>{nombre} será el torneo en curso: el que ven los jugadores y donde se abren las jornadas.</>,
        confirmar: 'Iniciar',
        icono: 'play_circle',
      },
      finalizar: {
        titulo: 'Finalizar torneo',
        mensaje: <>{nombre} quedará cerrado y ya no se le podrán agregar jornadas. Sus resultados se siguen pudiendo consultar.</>,
        confirmar: 'Finalizar',
        tono: 'peligro' as const,
        icono: 'flag',
      },
      eliminar: {
        titulo: 'Eliminar torneo',
        mensaje: <>Se borrará {nombre}. No se puede deshacer.</>,
        confirmar: 'Eliminar',
        tono: 'peligro' as const,
        icono: 'delete',
      },
    }
    if (!(await confirmar(preguntas[tipo]))) return
    const textos = { iniciar: 'en curso', finalizar: 'finalizado', eliminar: 'eliminado' }
    const ok = await op.ejecutar(
      `${tipo}-${t.id}`,
      async () => {
        if (tipo === 'eliminar') await torneosApi.eliminar(t.id)
        else await torneosApi.accion(t.id, tipo)
        return true
      },
      `${t.nombre} ${textos[tipo]}`,
    )
    if (ok) cargar()
  }

  async function guardar(t: Torneo, d: DatosTorneo) {
    const r = await op.ejecutar(`editar-${t.id}`, () => torneosApi.editar(t.id, d), 'Torneo actualizado')
    if (r) {
      setEditando(null)
      cargar()
    }
    return !!r
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-primary">
          <Icono nombre="arrow_back" className="text-lg!" /> Panel
        </Link>
        <h1 className="mt-2 text-4xl leading-tight font-extrabold tracking-tighter italic">
          TOR<span className="text-primary drop-shadow-[0_0_20px_rgba(19,236,91,0.5)]">NEOS</span>
        </h1>
      </div>

      <CrearTorneo onCreado={cargar} />

      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

      <section className="glass-card overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-black tracking-widest uppercase">Listado de torneos</h2>
        </div>
        {!torneos && !errorCarga && <p className="px-5 py-8 text-center text-sm text-white/50">Cargando…</p>}
        {torneos?.length === 0 && <p className="px-5 py-8 text-center text-sm text-white/50">Todavía no hay torneos.</p>}
        <ul className="divide-y divide-white/10">
          {torneos?.map((t) =>
            editando === t.id ? (
              <li key={t.id} className="px-5 py-4">
                <FormTorneo
                  inicial={t}
                  textoBoton="Guardar"
                  ocupado={op.ocupado === `editar-${t.id}`}
                  onEnviar={(d) => guardar(t, d)}
                  onCancelar={() => setEditando(null)}
                />
              </li>
            ) : (
              <FilaTorneo key={t.id} t={t} ocupado={op.ocupado} onEditar={() => setEditando(t.id)} onAccion={(a) => accion(t, a)} />
            ),
          )}
        </ul>
      </section>
    </div>
  )
}

function FilaTorneo(props: {
  t: Torneo
  ocupado: string | null
  onEditar: () => void
  onAccion: (a: 'iniciar' | 'finalizar' | 'eliminar') => void
}) {
  const { t } = props
  const e = ESTADOS_TORNEO[t.estado]
  const ocupada = props.ocupado?.endsWith(`-${t.id}`) ?? false
  const fechas = [verFecha(t.fechaInicio), verFecha(t.fechaFin)].filter(Boolean).join(' – ')
  const boton = 'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-[11px] font-black tracking-wider uppercase transition-colors disabled:opacity-40'
  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{t.nombre}</p>
          <p className="mt-0.5 text-xs text-white/50">
            {fechas || 'Sin fechas'} · {t.totalJornadas} {t.totalJornadas === 1 ? 'jornada' : 'jornadas'}
            {t.totalJornadas > 0 && ` (${t.jornadasFinalizadas} ${t.jornadasFinalizadas === 1 ? "finalizada" : "finalizadas"})`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${e.clase}`}>{e.texto}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/admin/jornadas?torneo=${t.id}`} className={`${boton} border-white/15 bg-white/5 text-white/80 hover:border-white/40`}>
          <Icono nombre="calendar_month" className="text-base!" /> Jornadas
        </Link>
        <button type="button" onClick={props.onEditar} disabled={ocupada} className={`${boton} border-white/15 bg-white/5 text-white/80 hover:border-white/40`}>
          <Icono nombre="edit" className="text-base!" /> Editar
        </button>
        {t.estado === 'proximo' && (
          <button type="button" onClick={() => props.onAccion('iniciar')} disabled={ocupada} className={`${boton} border-primary/40 bg-primary/10 text-primary hover:bg-primary/20`}>
            <Icono nombre="play_circle" className="text-base!" /> Iniciar
          </button>
        )}
        {t.estado !== 'finalizado' && (
          <button type="button" onClick={() => props.onAccion('finalizar')} disabled={ocupada} className={`${boton} border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20`}>
            <Icono nombre="flag" className="text-base!" /> Finalizar
          </button>
        )}
        {t.estado === 'proximo' && t.totalJornadas === 0 && (
          <button type="button" onClick={() => props.onAccion('eliminar')} disabled={ocupada} className={`${boton} border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20`}>
            <Icono nombre="delete" className="text-base!" /> Eliminar
          </button>
        )}
      </div>
    </li>
  )
}

function CrearTorneo({ onCreado }: { onCreado: () => void }) {
  const op = useOperacion()
  const [clave, setClave] = useState(0)

  async function crear(d: DatosTorneo) {
    const r = await op.ejecutar('crear', () => torneosApi.crear(d), `${d.nombre} creado. Inícialo cuando arranque y agrégale jornadas.`)
    if (r) {
      setClave((k) => k + 1)
      onCreado()
    }
    return !!r
  }

  return (
    <section className="glass-card space-y-5 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Icono nombre="add_circle" className="text-primary" />
        <h2 className="text-sm font-black tracking-widest uppercase">Crear torneo</h2>
      </div>
      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
      <FormTorneo key={clave} textoBoton="Crear torneo" ocupado={op.ocupado !== null} onEnviar={crear} />
    </section>
  )
}

function FormTorneo(props: {
  inicial?: Torneo
  textoBoton: string
  ocupado: boolean
  onEnviar: (d: DatosTorneo) => Promise<boolean>
  onCancelar?: () => void
}) {
  const [nombre, setNombre] = useState(props.inicial?.nombre ?? '')
  const [inicio, setInicio] = useState(props.inicial?.fechaInicio ?? '')
  const [fin, setFin] = useState(props.inicial?.fechaFin ?? '')
  const fechasMal = !!inicio && !!fin && fin < inicio

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (nombre.trim().length < 3 || fechasMal) return
    props.onEnviar({ nombre: nombre.trim(), fechaInicio: inicio || null, fechaFin: fin || null })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className={ETIQUETA}>Nombre del torneo</span>
        <input className={CAMPO} placeholder="Clausura 2027" maxLength={50} required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2">
          <span className={ETIQUETA}>Inicio (opcional)</span>
          <input className={`${CAMPO} scheme-dark`} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </label>
        <label className="block space-y-2">
          <span className={ETIQUETA}>Fin (opcional)</span>
          <input className={`${CAMPO} scheme-dark`} type="date" value={fin} min={inicio || undefined} onChange={(e) => setFin(e.target.value)} />
        </label>
      </div>
      {fechasMal && <p className="ml-1 text-xs text-red-300">La fecha de fin no puede ser antes del inicio.</p>}
      <div className="flex gap-3">
        {props.onCancelar && (
          <button
            type="button"
            onClick={props.onCancelar}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3.5 text-xs font-black tracking-widest text-white/80 uppercase hover:border-white/40"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={props.ocupado || nombre.trim().length < 3 || fechasMal}
          className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-fondo uppercase shadow-[0_10px_20px_rgba(19,236,91,0.2)] transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {props.ocupado ? 'Guardando…' : props.textoBoton}
        </button>
      </div>
    </form>
  )
}
