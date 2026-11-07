import { useCallback, useEffect, useState } from 'react'

import { pagosApi, type ComprobanteAdmin, type ListaPagos } from '../../api/pagos'
import type { EstadoComprobante } from '../../api/quinielas'
import { Alerta } from '../../components/Alerta'
import { Icono } from '../../components/Icono'
import { VisorArchivo } from '../../components/VisorArchivo'
import { fechaHoraCorta } from '../../lib/fechas'
import { useOperacion } from '../../lib/useOperacion'

const PESTANAS: { estado: EstadoComprobante; texto: string }[] = [
  { estado: 'en_revision', texto: 'Por revisar' },
  { estado: 'aprobado', texto: 'Validados' },
  { estado: 'rechazado', texto: 'Rechazados' },
]

/** Pantalla 7: validación de pagos con visor de comprobantes. "Validar" se habilita solo después de ver el archivo. */
export function AdminPagos() {
  const [estado, setEstado] = useState<EstadoComprobante>('en_revision')
  const [datos, setDatos] = useState<ListaPagos | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [abierto, setAbierto] = useState<ComprobanteAdmin | null>(null)
  const op = useOperacion()

  const cargar = useCallback(async (e: EstadoComprobante) => {
    try {
      setDatos(await pagosApi.listar(e))
      setErrorCarga(null)
    } catch (err) {
      setErrorCarga((err as Error).message)
    }
  }, [])

  useEffect(() => {
    cargar(estado)
  }, [cargar, estado])

  /** El archivo se abrió: la fila ya cuenta como vista. */
  function marcarVisto(id: number) {
    setDatos((d) => d && { ...d, elementos: d.elementos.map((c) => (c.id === id ? { ...c, visto: true } : c)) })
    setAbierto((a) => (a && a.id === id ? { ...a, visto: true } : a))
  }

  async function aprobar(c: ComprobanteAdmin) {
    const r = await op.ejecutar(`aprobar-${c.id}`, () => pagosApi.aprobar(c.id), `Pago de @${c.usuario.username} validado (#${c.quiniela.folio})`)
    if (r) terminar()
  }

  async function rechazar(c: ComprobanteAdmin, motivo: string) {
    const r = await op.ejecutar(`rechazar-${c.id}`, () => pagosApi.rechazar(c.id, motivo), `Pago de @${c.usuario.username} rechazado`)
    if (r) terminar()
  }

  function terminar() {
    setAbierto(null)
    cargar(estado)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Hola, Administrador</p>
        <h1 className="text-4xl leading-tight font-extrabold tracking-tighter italic">
          VALIDACIÓN DE <span className="text-primary drop-shadow-[0_0_20px_rgba(19,236,91,0.5)]">PAGOS</span>
        </h1>
      </div>

      <div className="flex gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.estado}
            type="button"
            onClick={() => {
              op.limpiar()
              setEstado(p.estado)
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[11px] font-black tracking-wider uppercase transition-colors ${
              estado === p.estado ? 'border-primary bg-primary/15 text-primary' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
            }`}
          >
            {p.texto}
            {datos && (
              <span className={`rounded-full px-1.5 text-[10px] ${p.estado === 'en_revision' && datos.conteos.en_revision > 0 ? 'bg-yellow-400 text-fondo' : 'bg-white/10'}`}>
                {datos.conteos[p.estado]}
              </span>
            )}
          </button>
        ))}
      </div>

      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}
      {errorCarga && <Alerta tipo="error">{errorCarga}</Alerta>}

      <section className="glass-card overflow-hidden rounded-2xl">
        {!datos && !errorCarga && <p className="px-5 py-8 text-center text-sm text-white/50">Cargando…</p>}
        {datos?.elementos.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-white/50">
            {estado === 'en_revision' ? 'No hay pagos por revisar. ¡Todo al día!' : 'Nada por aquí todavía.'}
          </p>
        )}
        <ul className="divide-y divide-white/10">
          {datos?.elementos.map((c, i) => (
            <FilaPago
              key={c.id}
              indice={i + 1}
              c={c}
              ocupado={op.ocupado}
              onVer={() => setAbierto(c)}
              onAprobar={() => aprobar(c)}
            />
          ))}
        </ul>
      </section>

      {abierto && (
        <VisorArchivo
          titulo={`${abierto.usuario.nombre} · Quiniela ${abierto.quiniela.numero}`}
          subtitulo={`@${abierto.usuario.username} · #${abierto.quiniela.folio} · ${abierto.jornada.nombre} · $${abierto.quiniela.monto}`}
          cargar={() => pagosApi.archivo(abierto.id)}
          onCargado={() => marcarVisto(abierto.id)}
          onCerrar={() => setAbierto(null)}
          pie={
            abierto.estado === 'en_revision' ? (
              <Decision c={abierto} ocupado={op.ocupado} onAprobar={() => aprobar(abierto)} onRechazar={(m) => rechazar(abierto, m)} />
            ) : abierto.motivoRechazo ? (
              <p className="text-sm text-red-200">Motivo: {abierto.motivoRechazo}</p>
            ) : undefined
          }
        />
      )}
    </div>
  )
}

function FilaPago(props: {
  indice: number
  c: ComprobanteAdmin
  ocupado: string | null
  onVer: () => void
  onAprobar: () => void
}) {
  const { c } = props
  const pendiente = c.estado === 'en_revision'
  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${c.visto && pendiente ? 'bg-primary/5' : ''}`}>
      <span className="w-5 shrink-0 text-center text-xs font-black text-white/30">{props.indice}</span>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[11px] font-black uppercase">
        {c.usuario.username.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{c.usuario.nombre}</p>
        <p className="truncate text-[11px] text-white/50">
          #{c.quiniela.folio} · {c.jornada.nombre} · Q{c.quiniela.numero} · ${c.quiniela.monto}
        </p>
        <p className="text-[10px] text-white/35">
          {pendiente ? `Subido ${fechaHoraCorta(c.subidoAt)}` : `Revisado ${fechaHoraCorta(c.revisadoAt ?? c.subidoAt)}`}
          {c.motivoRechazo && <span className="text-red-300/80"> · {c.motivoRechazo}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={props.onVer}
        aria-label="Ver comprobante"
        title="Ver comprobante"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          c.visto ? 'border-white/15 bg-white/5 text-white/60' : 'border-yellow-300/50 bg-yellow-400/10 text-yellow-200 hover:bg-yellow-400/20'
        }`}
      >
        <Icono nombre="visibility" className="text-lg!" />
      </button>
      {pendiente && (
        <button
          type="button"
          onClick={props.onAprobar}
          disabled={!c.visto || props.ocupado !== null}
          title={c.visto ? 'Validar pago' : 'Primero abre el comprobante'}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[10px] font-black tracking-tight text-fondo uppercase transition-all enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Validar
        </button>
      )}
    </li>
  )
}

function Decision(props: { c: ComprobanteAdmin; ocupado: string | null; onAprobar: () => void; onRechazar: (motivo: string) => void }) {
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const listo = props.c.visto && props.ocupado === null

  if (rechazando) {
    return (
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (motivo.trim().length >= 3) props.onRechazar(motivo.trim())
        }}
      >
        <label className="block space-y-2">
          <span className="text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">Motivo del rechazo (lo verá el usuario)</span>
          <input
            autoFocus
            maxLength={255}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. No se ve el monto ni la fecha"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-red-400"
          />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setRechazando(false)} className="flex-1 rounded-xl border border-white/15 py-3 text-xs font-black uppercase">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!listo || motivo.trim().length < 3}
            className="flex-1 rounded-xl bg-red-500 py-3 text-xs font-black text-white uppercase disabled:opacity-40"
          >
            Rechazar pago
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setRechazando(true)}
        disabled={!listo}
        className="flex-1 rounded-xl bg-red-500 py-3.5 text-xs font-black tracking-wider text-white uppercase disabled:opacity-40"
      >
        Rechazar
      </button>
      <button
        type="button"
        onClick={props.onAprobar}
        disabled={!listo}
        className="flex-[2] rounded-xl bg-primary py-3.5 text-xs font-black tracking-wider text-fondo uppercase shadow-[0_0_15px_rgba(19,236,91,0.3)] disabled:opacity-40"
      >
        {props.ocupado?.startsWith('aprobar') ? 'Validando…' : `Validar pago · $${props.c.quiniela.monto}`}
      </button>
    </div>
  )
}
