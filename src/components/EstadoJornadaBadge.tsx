import type { EstadoVisual } from '../api/jornadas'

const ESTILO: Record<EstadoVisual, { texto: string; clase: string }> = {
  BORRADOR: { texto: 'Borrador', clase: 'bg-white/10 text-white/70 border-white/15' },
  ACTIVA: { texto: 'Activa', clase: 'bg-primary/15 text-primary border-primary/40' },
  CERRADA: { texto: 'Cerrada', clase: 'bg-red-500/15 text-red-300 border-red-400/40' },
  EN_JUEGO: { texto: 'En juego', clase: 'bg-yellow-400/15 text-yellow-200 border-yellow-300/40' },
  FINALIZADA: { texto: 'Finalizada', clase: 'bg-sky-400/15 text-sky-200 border-sky-300/40' },
}

export function EstadoJornadaBadge({ estado }: { estado: EstadoVisual }) {
  const e = ESTILO[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${e.clase}`}>
      {estado === 'EN_JUEGO' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-300" />}
      {e.texto}
    </span>
  )
}
