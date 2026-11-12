import type { EstadoVisual } from '../api/jornadas'
import type { EstadoQuiniela } from '../api/quinielas'

/** Colores de la especificación: gris borrador, amarillo esperando pago/validación, verde participando, rojo rechazada. */
const ESTILO: Record<EstadoQuiniela, { texto: string; clase: string; punto: string }> = {
  borrador: { texto: 'Borrador', clase: 'bg-white/10 text-white/70 border-white/15', punto: 'bg-white/50' },
  pendiente_pago: { texto: 'Pendiente de pago', clase: 'bg-yellow-400/15 text-yellow-200 border-yellow-300/40', punto: 'bg-yellow-300' },
  en_revision: { texto: 'Validando pago', clase: 'bg-yellow-400/15 text-yellow-200 border-yellow-300/40', punto: 'bg-yellow-300 animate-pulse' },
  participando: { texto: 'Participando', clase: 'bg-primary/15 text-primary border-primary/40', punto: 'bg-primary' },
  rechazada: { texto: 'Pago rechazado', clase: 'bg-red-500/15 text-red-300 border-red-400/40', punto: 'bg-red-400' },
}

/** Una quiniela que participa cambia su leyenda según cómo va la jornada. */
const PARTICIPANDO_POR_JORNADA: Partial<Record<EstadoVisual, { texto: string; clase: string; punto: string }>> = {
  EN_JUEGO: { texto: 'En juego', clase: 'bg-yellow-400/15 text-yellow-200 border-yellow-300/40', punto: 'bg-yellow-300 animate-pulse' },
  CERRADA: { texto: 'Cerrada', clase: 'bg-white/10 text-white/70 border-white/20', punto: 'bg-white/50' },
  FINALIZADA: { texto: 'Terminada', clase: 'bg-sky-400/15 text-sky-200 border-sky-300/40', punto: 'bg-sky-300' },
}

export function EstadoQuinielaBadge({ estado, jornada }: { estado: EstadoQuiniela; jornada?: EstadoVisual }) {
  const e = (estado === 'participando' && jornada && PARTICIPANDO_POR_JORNADA[jornada]) || ESTILO[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest whitespace-nowrap uppercase ${e.clase}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
      {e.texto}
    </span>
  )
}
