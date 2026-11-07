import { useEffect, useState } from 'react'

import type { Partido } from '../api/jornadas'
import { rankingApi, type Celda, type FilaRanking, type JornadaOpcion, type Ranking as RankingDatos } from '../api/ranking'
import { Alerta } from '../components/Alerta'
import { EstadoJornadaBadge } from '../components/EstadoJornadaBadge'
import { Icono } from '../components/Icono'

const pesos = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

/** Pantalla 9: ranking de la jornada con la rejilla de pronósticos (columnas fijas a los lados). */
export function Ranking() {
  const [opciones, setOpciones] = useState<JornadaOpcion[]>([])
  const [idJornada, setIdJornada] = useState<number | undefined>(undefined)
  const [datos, setDatos] = useState<RankingDatos | null | undefined>(undefined) // undefined = cargando, null = no hay
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    rankingApi
      .jornadas()
      .then((j) => setOpciones(j.jornadas))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let vivo = true
    rankingApi
      .ver(idJornada)
      .then((r) => {
        if (!vivo) return
        setDatos(r ?? null)
        setError(null)
      })
      .catch((e: Error) => vivo && setError(e.message))
    return () => {
      vivo = false
    }
  }, [idJornada])

  const j = datos?.jornada

  return (
    <div className="space-y-5">
      <div className="space-y-3 text-center">
        {opciones.length > 0 && (
          <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 py-1.5 pr-2 pl-4">
            <Icono nombre="calendar_month" className="text-base! text-primary" />
            <select
              aria-label="Jornada"
              value={idJornada ?? j?.id ?? ''}
              onChange={(e) => setIdJornada(Number(e.target.value))}
              className="bg-transparent pr-1 text-xs font-black tracking-widest text-white uppercase outline-none [&>option]:bg-fondo"
            >
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <h1 className="text-4xl font-extrabold tracking-tighter uppercase italic drop-shadow-[0_0_20px_rgba(19,236,91,0.4)]">
          RESULTA<span className="text-primary">DOS</span>
        </h1>
        {j && (
          <div className="flex justify-center">
            <EstadoJornadaBadge estado={j.estadoVisual} />
          </div>
        )}
      </div>

      {error && <Alerta tipo="error">{error}</Alerta>}
      {datos === undefined && !error && <p className="text-center text-sm text-white/50">Cargando…</p>}
      {datos === null && <p className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">Todavía no hay jornadas publicadas.</p>}

      {datos && (
        <>
          <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-white/[0.03] px-6 py-4 text-center shadow-[inset_0_0_20px_rgba(19,236,91,0.05)] backdrop-blur-md">
            <span className="mb-1 text-[10px] font-black tracking-[0.3em] text-white/50 uppercase">
              {j?.estado === 'finalizada' ? 'Bolsa repartida' : 'Bolsa acumulada'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary [text-shadow:0_0_15px_rgba(19,236,91,0.7),0_0_30px_rgba(19,236,91,0.3)]">
                {pesos.format(datos.bolsa.bolsa).replace('MXN', '').trim()}
              </span>
              <span className="text-xs font-bold text-primary/80">MXN</span>
            </div>
            <span className="mt-1 text-[11px] text-white/40">
              {datos.bolsa.participantes} {datos.bolsa.participantes === 1 ? 'quiniela participando' : 'quinielas participando'}
            </span>
          </div>

          <Ganadores filas={datos.filas} />

          {!datos.pronosticosVisibles && datos.filas.length > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
              <Icono nombre="lock" className="text-sm! text-yellow-200" />
              Los pronósticos de los demás se muestran cuando cierra la jornada.
            </p>
          )}

          {datos.filas.length === 0 ? (
            <p className="glass-card rounded-2xl p-8 text-center text-sm text-white/50">
              Aún no hay quinielas con pago validado en esta jornada.
            </p>
          ) : (
            <Rejilla datos={datos} />
          )}

          <Leyenda />
        </>
      )}
    </div>
  )
}

function Ganadores({ filas }: { filas: FilaRanking[] }) {
  const ganadores = filas.filter((f) => f.ganador)
  if (ganadores.length === 0) return null
  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl border-yellow-300/30 px-5 py-3">
      <Icono nombre="emoji_events" className="text-3xl! text-yellow-300" />
      <div className="min-w-0 text-sm">
        <p className="text-[10px] font-black tracking-widest text-yellow-200/80 uppercase">
          {ganadores.length === 1 ? 'Ganador' : `Empate · ${ganadores.length} ganadores`}
        </p>
        <p className="truncate font-bold">
          {ganadores.map((g) => nombreFila(g)).join(', ')}
          {ganadores[0].premio !== null && (
            <span className="text-primary"> · {pesos.format(ganadores[0].premio)} c/u</span>
          )}
        </p>
      </div>
    </div>
  )
}

function Rejilla({ datos }: { datos: RankingDatos }) {
  const columnas = `minmax(132px, 160px) repeat(${datos.partidos.length}, minmax(52px, 1fr)) 64px`
  const fijoIzq = 'sticky left-0 z-20 backdrop-blur-md border-r border-white/10'
  const fondo = (mia: boolean) => (mia ? 'bg-[#123321]' : 'bg-[#0e1712]')
  const fijoDer = 'sticky right-0 z-10 backdrop-blur-md border-l border-white/10'

  return (
    <div className="glass-card -mx-4 overflow-hidden rounded-2xl shadow-2xl sm:mx-0">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid w-max min-w-full" style={{ gridTemplateColumns: columnas }}>
          {/* Encabezado */}
          <div className={`${fijoIzq} ${fondo(false)} flex items-center border-b border-white/10 px-4 py-3`}>
            <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Usuario</span>
          </div>
          {datos.partidos.map((p) => (
            <Encabezado key={p.id} p={p} />
          ))}
          <div className={`${fijoDer} ${fondo(false)} flex items-center justify-end border-b border-white/10 pr-3`}>
            <span className="text-[10px] font-black tracking-widest text-primary uppercase">Pts</span>
          </div>

          {/* Filas */}
          {datos.filas.map((f) => {
            const porPartido = new Map(f.pronosticos.map((c) => [c.idPartido, c]))
            const resaltar = f.esMia ? 'bg-primary/10' : ''
            return (
              <div key={f.idQuiniela} className="contents">
                <div className={`${fijoIzq} flex items-center gap-2 border-b border-white/5 px-3 py-3 ${fondo(f.esMia)}`}>
                  <Medalla posicion={f.posicion} />
                  <div className="min-w-0">
                    <p className={`truncate text-[12px] font-bold ${f.esMia ? 'text-primary' : ''}`}>
                      {nombreFila(f)}
                      {f.esMia && ' (Tú)'}
                    </p>
                    <p className="text-[9px] text-white/40">
                      {f.exactos} {f.exactos === 1 ? 'exacto' : 'exactos'} · #{f.folio}
                    </p>
                  </div>
                </div>
                {datos.partidos.map((p) => (
                  <div key={p.id} className={`flex flex-col items-center justify-center border-b border-white/5 py-2 ${resaltar}`}>
                    <CeldaPronostico c={porPartido.get(p.id)} oculto={!datos.pronosticosVisibles && !f.esMia} suspendido={p.estado === 'suspendido'} />
                  </div>
                ))}
                <div className={`${fijoDer} flex flex-col items-end justify-center border-b border-white/5 pr-3 ${fondo(f.esMia)}`}>
                  <span className="text-base font-black text-primary">{f.puntos}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Siglas de los equipos y, abajo, el marcador real (o la hora si no se ha jugado). */
function Encabezado({ p }: { p: Partido }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 border-b border-white/10 bg-white/5 px-1 py-2 text-center">
      <span className="text-[9px] leading-tight font-bold text-white/70">
        {p.local.abreviatura}
        <br />
        {p.visitante.abreviatura}
      </span>
      {p.estado === 'finalizado' ? (
        <span className="rounded bg-white/10 px-1.5 text-[10px] font-black text-white">
          {p.golesLocal}-{p.golesVisitante}
        </span>
      ) : p.estado === 'suspendido' ? (
        <span className="text-[8px] font-black text-red-300/70 uppercase">Susp.</span>
      ) : (
        <span className="text-[8px] text-white/30">—</span>
      )}
    </div>
  )
}

function CeldaPronostico({ c, oculto, suspendido }: { c: Celda | undefined; oculto: boolean; suspendido: boolean }) {
  const caja = 'relative flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold'
  if (oculto) {
    return (
      <div className={`${caja} bg-white/5 text-white/25`}>
        <Icono nombre="lock" className="text-sm!" />
      </div>
    )
  }
  if (!c) return <div className={`${caja} border border-dashed border-white/10 text-white/20`}>–</div>

  let estilo = 'bg-white/10 text-white/70' // sin marcador todavía
  if (suspendido) estilo = 'bg-white/5 text-white/30 line-through'
  else if (c.puntos === 3) estilo = 'bg-primary text-black ring-2 ring-primary ring-offset-2 ring-offset-[#0e1712] shadow-[0_0_14px_rgba(19,236,91,0.8)]'
  else if (c.puntos === 1) estilo = 'bg-primary/80 text-black shadow-[0_0_10px_rgba(19,236,91,0.3)]'
  else if (c.puntos === 0) estilo = 'border border-red-500/30 bg-red-500/20 text-red-400'

  return (
    <>
      <div className={`${caja} ${estilo}`} title={c.puntos === null ? 'Sin marcador' : `+${c.puntos}`}>
        {c.seleccion}
        {c.exacto && (
          <Icono nombre="star" className="absolute -top-2 -right-2 text-[13px]! text-yellow-300 [font-variation-settings:'FILL'_1]" />
        )}
      </div>
      <span className="mt-1 text-[8px] font-medium text-white/40">
        {c.golesLocal} - {c.golesVisitante}
      </span>
    </>
  )
}

function Medalla({ posicion }: { posicion: number }) {
  const colores: Record<number, string> = {
    1: 'bg-gradient-to-br from-yellow-200 to-yellow-500 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]',
    2: 'bg-gradient-to-br from-slate-100 to-slate-400 text-black',
    3: 'bg-gradient-to-br from-amber-500 to-amber-800 text-white',
  }
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${colores[posicion] ?? 'text-white/40'}`}
      aria-label={`Lugar ${posicion}`}
    >
      {posicion}
    </span>
  )
}

function Leyenda() {
  const item = (clase: string, texto: string, estrella = false) => (
    <span className="flex items-center gap-1.5">
      <span className={`relative inline-block h-3.5 w-3.5 rounded ${clase}`}>
        {estrella && <Icono nombre="star" className="absolute -top-1.5 -right-1.5 text-[9px]! text-yellow-300" />}
      </span>
      {texto}
    </span>
  )
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] text-white/50">
      {item('bg-primary ring-1 ring-primary ring-offset-1 ring-offset-[#0e1712]', 'Exacto +3', true)}
      {item('bg-primary/80', 'Resultado +1')}
      {item('border border-red-500/30 bg-red-500/20', 'Fallo 0')}
      {item('bg-white/10', 'Sin marcador')}
    </div>
  )
}

function nombreFila(f: FilaRanking) {
  return f.variasQuinielas ? `${f.username} (Q${f.numero})` : f.username
}
