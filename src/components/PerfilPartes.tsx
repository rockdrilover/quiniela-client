import { Link } from 'react-router'

import type { DatosUsuario, Estadisticas, Historial } from '../api/perfil'
import { Icono } from './Icono'

const pesos = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

const ESTADOS: Record<DatosUsuario['estado'], { texto: string; clase: string }> = {
  pendiente: { texto: 'Pendiente', clase: 'bg-yellow-400/15 text-yellow-200 border-yellow-300/40' },
  aprobado: { texto: 'Aprobado', clase: 'bg-primary/15 text-primary border-primary/40' },
  bloqueado: { texto: 'Bloqueado', clase: 'bg-red-500/15 text-red-300 border-red-400/40' },
}

export function EstadoUsuarioBadge({ estado }: { estado: DatosUsuario['estado'] }) {
  const e = ESTADOS[estado]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${e.clase}`}>
      {e.texto}
    </span>
  )
}

/** "Estadísticas personales" de la especificación: puntos y quinielas ganadas al frente. */
export function TarjetasEstadisticas({ e }: { e: Estadisticas }) {
  const tarjetas = [
    { icono: 'stars', valor: e.puntosTotales, texto: 'Puntos totales', resaltar: true },
    { icono: 'emoji_events', valor: e.quinielasGanadas, texto: 'Quinielas ganadas', resaltar: true },
    { icono: 'sports_soccer', valor: e.quinielasJugadas, texto: 'Quinielas jugadas' },
    { icono: 'target', valor: e.exactosTotales, texto: 'Marcadores exactos' },
  ]
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-black tracking-[0.2em] text-white/60 uppercase">Estadísticas personales</h2>
      <div className="grid grid-cols-2 gap-3">
        {tarjetas.map((t) => (
          <div key={t.texto} className="glass-card rounded-2xl p-4">
            <Icono nombre={t.icono} className={`text-xl! ${t.resaltar ? 'text-primary' : 'text-white/40'}`} />
            <p className={`mt-1 text-3xl font-black ${t.resaltar ? 'text-primary' : ''}`}>{t.valor}</p>
            <p className="text-[10px] font-bold tracking-wider text-white/50 uppercase">{t.texto}</p>
          </div>
        ))}
      </div>
      {e.premiosGanados > 0 && (
        <p className="glass-card flex items-center justify-center gap-2 rounded-2xl border-yellow-300/30 py-3 text-sm">
          <Icono nombre="paid" className="text-yellow-300" />
          Has ganado <strong className="text-yellow-200">{pesos.format(e.premiosGanados)}</strong> en premios
        </p>
      )}
    </section>
  )
}

/** Últimas participaciones (solo quinielas pagadas, que son las que cuentan). */
export function ListaHistorial({ h, enlazar }: { h: Historial[]; enlazar: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-black tracking-[0.2em] text-white/60 uppercase">Historial</h2>
      {h.length === 0 ? (
        <p className="glass-card rounded-2xl p-5 text-center text-sm text-white/50">
          Todavía no hay participaciones con pago validado.
        </p>
      ) : (
        <ul className="glass-card divide-y divide-white/10 overflow-hidden rounded-2xl">
          {h.map((x) => {
            const contenido = (
              <>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    x.ganador ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {x.ganador ? <Icono nombre="emoji_events" className="text-lg!" /> : `${x.posicion}°`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {x.jornada} <span className="font-normal text-white/40">· Q{x.numero} #{x.folio}</span>
                  </p>
                  <p className="text-[11px] text-white/50">
                    Lugar {x.posicion} de {x.participantes} · {x.exactos} {x.exactos === 1 ? 'exacto' : 'exactos'}
                    {x.estadoJornada !== 'finalizada' && ' · en curso'}
                    {x.premio !== null && <span className="text-yellow-200"> · {pesos.format(x.premio)}</span>}
                  </p>
                </div>
                <span className="text-lg font-black text-primary">{x.puntos}</span>
              </>
            )
            return (
              <li key={x.idQuiniela}>
                {enlazar ? (
                  <Link to={`/quinielas/${x.idQuiniela}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
                    {contenido}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">{contenido}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
