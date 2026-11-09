import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import type { JornadaDetalle, Partido } from '../api/jornadas'
import { quinielasApi, seleccionDe, type Pago, type Pronostico, type Quiniela, type QuinielaDetalle, type Seleccion } from '../api/quinielas'
import { Alerta } from '../components/Alerta'
import { useConfirmar } from '../components/Confirmar'
import { EquipoChip } from '../components/EquipoChip'
import { EstadoQuinielaBadge } from '../components/EstadoQuinielaBadge'
import { PagoPrevio, SeccionPago } from '../components/SeccionPago'
import { Icono } from '../components/Icono'
import { fechaHoraCorta } from '../lib/fechas'
import { useOperacion } from '../lib/useOperacion'

type Marcador = { l: string; v: string }
type Captura = Record<number, Marcador>

const MAX_GOLES = 20

/** Pantalla 6: captura de pronósticos. Sirve para /quinielas/nueva y /quinielas/:id (editar o solo lectura). */
export function Pronosticos() {
  const { id } = useParams()
  const esNueva = id === undefined
  const navegar = useNavigate()
  const op = useOperacion()
  const confirmar = useConfirmar()

  const [jornada, setJornada] = useState<JornadaDetalle | null>(null)
  const [quiniela, setQuiniela] = useState<Quiniela | null>(null)
  const [pronosticos, setPronosticos] = useState<Pronostico[]>([])
  const [captura, setCaptura] = useState<Captura>({})
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [pago, setPago] = useState<Pago | null>(null)
  /** Comprobante elegido antes de enviar: se sube en cuanto la quiniela queda enviada. */
  const [comprobante, setComprobante] = useState<File | null>(null)

  useEffect(() => {
    let vivo = true
    const carga = esNueva
      ? quinielasApi.jornadaActual().then((j) => {
          if (!vivo) return
          if (!j || !j.jornada.aceptaPronosticos) throw new Error('No hay una jornada abierta para crear quinielas')
          setJornada(j)
          setQuiniela(null)
          setPronosticos([])
          setCaptura({})
          setPago(null)
        })
      : quinielasApi.detalle(Number(id)).then((d) => vivo && aplicar(d))
    carga.catch((e: Error) => vivo && setErrorCarga(e.message))
    return () => {
      vivo = false
    }
  }, [id, esNueva])

  function aplicar({ jornada: j, quiniela: q, pronosticos: ps, pago: pg }: QuinielaDetalle) {
    setPago(pg)
    setJornada(j)
    setQuiniela(q)
    setPronosticos(ps)
    setCaptura(Object.fromEntries(ps.map((p) => [p.idPartido, { l: String(p.golesLocal), v: String(p.golesVisitante) }])))
  }

  const editable = esNueva || (quiniela?.editable ?? false)
  const jugables = useMemo(() => jornada?.partidos.filter((p) => p.estado !== 'suspendido') ?? [], [jornada])
  const capturados = jugables.filter((p) => completo(captura[p.id])).length
  const yaEnviada = quiniela !== null && quiniela.estado !== 'borrador'

  function cambiar(idPartido: number, m: Marcador) {
    op.limpiar()
    setCaptura((c) => ({ ...c, [idPartido]: m }))
  }

  function entradas() {
    return jugables
      .filter((p) => completo(captura[p.id]))
      .map((p) => ({ idPartido: p.id, golesLocal: Number(captura[p.id].l), golesVisitante: Number(captura[p.id].v) }))
  }

  async function guardar(enviar: boolean) {
    if (!jornada) return
    const lista = entradas()
    if ((enviar || yaEnviada) && lista.length < jugables.length) {
      const faltan = jugables.length - lista.length
      op.error(`Te ${faltan === 1 ? 'falta 1 partido' : `faltan ${faltan} partidos`} por pronosticar`)
      return
    }
    if (!enviar && lista.length === 0) return
    const archivo = enviar && !yaEnviada ? comprobante : null
    let fallo: string | null = null
    const r = await op.ejecutar(
      enviar ? 'enviar' : 'guardar',
      async () => {
        const d = await (quiniela
          ? quinielasApi.guardar(quiniela.id, lista, enviar)
          : quinielasApi.crear(jornada.jornada.id, lista, enviar))
        if (!archivo || !d.pago.puedeSubir) return d
        // La quiniela ya quedó enviada: si el comprobante falla, se puede volver a subir desde la sección de pago
        try {
          return await quinielasApi.subirComprobante(d.quiniela.id, archivo)
        } catch (e) {
          fallo = (e as Error).message
          return d
        }
      },
      archivo ? 'Quiniela enviada con tu comprobante. Te avisaremos por correo cuando lo revisemos.' : 'Pronósticos guardados correctamente',
    )
    if (!r) return
    if (archivo) setComprobante(null)
    aplicar(r)
    if (fallo) op.error(`Tu quiniela se envió, pero el comprobante no se subió (${fallo}). Súbelo de nuevo en la sección de pago.`)
    if (esNueva) navegar(`/quinielas/${r.quiniela.id}`, { replace: true })
  }

  async function eliminar() {
    if (!quiniela) return
    const seguro = await confirmar({
      titulo: 'Eliminar quiniela',
      mensaje: (
        <>
          Se borrará la <strong>Quiniela {quiniela.numero}</strong> con sus pronósticos. No se puede deshacer.
        </>
      ),
      confirmar: 'Eliminar',
      tono: 'peligro',
      icono: 'delete',
    })
    if (!seguro) return
    const ok = await op.ejecutar('eliminar', async () => {
      await quinielasApi.eliminar(quiniela.id)
      return true
    })
    if (ok) navegar('/', { replace: true })
  }

  if (errorCarga) {
    return (
      <div className="space-y-4">
        <Alerta tipo="error">{errorCarga}</Alerta>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <Icono nombre="arrow_back" className="text-base!" /> Volver a mis quinielas
        </Link>
      </div>
    )
  }
  if (!jornada) return <p className="text-center text-sm text-white/50">Cargando…</p>

  const j = jornada.jornada
  const porPartido = new Map(pronosticos.map((p) => [p.idPartido, p]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:border-primary">
          <Icono nombre="arrow_back" />
        </Link>
        <div className="text-right">
          <p className="text-xs font-black tracking-[0.2em] text-primary uppercase">{j.nombre}</p>
          <p className="text-[11px] text-white/50">
            {j.aceptaPronosticos && j.fechaCierre ? `Cierra ${fechaHoraCorta(j.fechaCierre)}` : 'Pronósticos cerrados'}
          </p>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(19,236,91,0.3)]">
          PREDIC<span className="text-primary">CIONES</span>
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-white/60">
          <span className="font-bold text-white">{quiniela ? `Quiniela ${quiniela.numero}` : 'Nueva quiniela'}</span>
          {quiniela && <span>#{quiniela.folio}</span>}
          {quiniela && <EstadoQuinielaBadge estado={quiniela.estado} />}
        </div>
        {quiniela?.puntos !== null && quiniela?.puntos !== undefined && (
          <p className="mt-3 text-sm">
            <span className="text-3xl font-black text-primary">{quiniela.puntos}</span>{' '}
            <span className="text-white/60">pts · {quiniela.exactos} exactos</span>
          </p>
        )}
      </div>

      {!editable && (
        <Alerta tipo="aviso">
          {j.aceptaPronosticos ? 'Esta quiniela es de solo lectura.' : 'La jornada ya cerró: tus pronósticos quedan en solo lectura.'}
        </Alerta>
      )}
      <ul className="space-y-4">
        {jornada.partidos.map((p) => (
          <TarjetaPartido
            key={p.id}
            p={p}
            m={captura[p.id]}
            pron={porPartido.get(p.id)}
            editable={editable && p.estado !== 'suspendido'}
            onCambio={(m) => cambiar(p.id, m)}
          />
        ))}
      </ul>

      {yaEnviada && quiniela && pago && <SeccionPago q={quiniela} pago={pago} onActualizada={aplicar} />}
      {!yaEnviada && editable && <PagoPrevio monto={quiniela?.monto ?? j.precio} archivo={comprobante} onArchivo={setComprobante} />}

      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}

      {editable && (
        <div className="space-y-3 pb-4">
          <p className="text-center text-xs text-white/50">
            {capturados}/{jugables.length} partidos capturados
          </p>
          <button
            type="button"
            onClick={() => guardar(true)}
            disabled={op.ocupado !== null}
            className="w-full rounded-full bg-primary py-5 text-sm font-black tracking-widest text-fondo uppercase shadow-[0_10px_30px_rgba(19,236,91,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {op.ocupado === 'enviar' ? 'GUARDANDO…' : yaEnviada ? 'GUARDAR CAMBIOS' : 'ENVIAR QUINIELA'}
          </button>
          {!yaEnviada && (
            <button
              type="button"
              onClick={() => guardar(false)}
              disabled={op.ocupado !== null || capturados === 0}
              className="w-full rounded-full border border-white/15 bg-white/5 py-3.5 text-xs font-black tracking-widest text-white/80 uppercase transition-colors hover:border-white/40 disabled:opacity-40"
            >
              {op.ocupado === 'guardar' ? 'GUARDANDO…' : 'Guardar borrador'}
            </button>
          )}
          {quiniela && (quiniela.estado === 'borrador' || quiniela.estado === 'pendiente_pago') && (
            <button
              type="button"
              onClick={eliminar}
              disabled={op.ocupado !== null}
              className="mx-auto flex items-center gap-1 text-xs font-bold text-red-300/80 hover:text-red-300 disabled:opacity-40"
            >
              <Icono nombre="delete" className="text-base!" /> Eliminar quiniela
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function completo(m: Marcador | undefined): m is Marcador {
  return m !== undefined && m.l !== '' && m.v !== ''
}

function TarjetaPartido(props: {
  p: Partido
  m: Marcador | undefined
  pron: Pronostico | undefined
  editable: boolean
  onCambio: (m: Marcador) => void
}) {
  const { p, m, pron, editable, onCambio } = props
  const sel: Seleccion | null = completo(m) ? seleccionDe(Number(m.l), Number(m.v)) : null
  const suspendido = p.estado === 'suspendido'

  /** Al tocar L/E/V se ajusta el marcador para que siempre coincida (lógica espejo). */
  function elegir(s: Seleccion) {
    const l = m?.l === '' || m === undefined ? 0 : Number(m.l)
    const v = m?.v === '' || m === undefined ? 0 : Number(m.v)
    if (completo(m) && seleccionDe(l, v) === s) return
    if (s === 'E') onCambio({ l: String(Math.max(l, v)), v: String(Math.max(l, v)) })
    else if (s === 'L') onCambio({ l: String(Math.min(MAX_GOLES, Math.max(l, v + 1))), v: String(Math.min(v, MAX_GOLES - 1)) })
    else onCambio({ l: String(Math.min(l, MAX_GOLES - 1)), v: String(Math.min(MAX_GOLES, Math.max(v, l + 1))) })
  }

  function goles(lado: 'l' | 'v', valor: string) {
    const limpio = valor.replace(/\D/g, '').slice(0, 2)
    const n = limpio === '' ? '' : String(Math.min(MAX_GOLES, Number(limpio)))
    onCambio({ l: m?.l ?? '', v: m?.v ?? '', [lado]: n })
  }

  const borde =
    pron?.exacto ? 'border-primary shadow-[0_0_20px_rgba(19,236,91,0.35)]' : pron?.puntos === 1 ? 'border-primary/40' : ''

  return (
    <li className={`glass-card rounded-[2rem] p-5 shadow-2xl ${borde} ${suspendido ? 'opacity-50' : ''}`}>
      <p className="mb-3 text-center text-[10px] font-bold tracking-widest text-white/40 uppercase">
        {suspendido ? 'Suspendido · no cuenta' : fechaHoraCorta(p.fechaHora)}
      </p>
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <EquipoChip equipo={p.local} />
        <div className="flex items-center gap-2">
          <CajaGoles valor={m?.l ?? ''} editable={editable} etiqueta={`Goles de ${p.local.nombre}`} onCambio={(v) => goles('l', v)} />
          <span className="font-bold text-white/40">-</span>
          <CajaGoles valor={m?.v ?? ''} editable={editable} etiqueta={`Goles de ${p.visitante.nombre}`} onCambio={(v) => goles('v', v)} />
        </div>
        <EquipoChip equipo={p.visitante} />
      </div>

      {!suspendido && (
        <div className="flex justify-center gap-3">
          {(['L', 'E', 'V'] as const).map((s) => (
            <button
              key={s}
              type="button"
              disabled={!editable}
              onClick={() => elegir(s)}
              aria-pressed={sel === s}
              title={s === 'L' ? 'Gana local' : s === 'E' ? 'Empate' : 'Gana visitante'}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black transition-all ${
                sel === s
                  ? 'bg-primary text-fondo shadow-[0_0_15px_rgba(19,236,91,0.4)]'
                  : 'border border-white/10 bg-white/5 text-white/60 enabled:hover:border-primary/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {p.estado === 'finalizado' && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs">
          <span className="text-white/50">
            Resultado: <strong className="text-white">{p.golesLocal} - {p.golesVisitante}</strong>
          </span>
          {pron ? <Puntos puntos={pron.puntos} exacto={pron.exacto} /> : <span className="text-white/40">Sin pronóstico</span>}
        </div>
      )}
    </li>
  )
}

function Puntos({ puntos, exacto }: { puntos: number | null; exacto: boolean }) {
  if (puntos === null) return null
  return (
    <span className={`flex items-center gap-1 font-black ${puntos > 0 ? 'text-primary' : 'text-white/40'}`}>
      {exacto && <Icono nombre="star" className="text-base!" />}+{puntos} {puntos === 1 ? 'pt' : 'pts'}
    </span>
  )
}

function CajaGoles(props: { valor: string; editable: boolean; etiqueta: string; onCambio: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      aria-label={props.etiqueta}
      placeholder="–"
      value={props.valor}
      readOnly={!props.editable}
      onChange={(e) => props.onCambio(e.target.value)}
      onFocus={(e) => e.target.select()}
      className="h-12 w-12 rounded-xl border border-white/10 bg-black/40 text-center text-xl font-bold text-white outline-none placeholder:text-white/20 focus:border-primary read-only:border-transparent read-only:bg-white/5"
    />
  )
}
