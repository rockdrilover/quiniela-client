import type { EstadoQuiniela } from '../api/quinielas'

/** Colores de la especificación: gris borrador, amarillo esperando pago/validación, verde participando, rojo rechazada. */
const ESTILO: Record<EstadoQuiniela, { texto: string; clase: string; punto: string }> = {
  borrador: { texto: 'Borrador', clase: 'bg-white/10 text-white/70 border-white/15', punto: 'bg-white/50' },
  pendiente_pago: { texto: 'Pendiente de pago', clase: 'bg-yellow-400/15 text-yellow-200 border-yellow-300/40', punto: 'bg-yellow-300' },
  en_revision: { texto: 'Validando pago', clase: 'bg-yellow-400/15 text-yellow-200 border-yellow-300/40', punto: 'bg-yellow-300 animate-pulse' },
  participando: { texto: 'Participando', clase: 'bg-primary/15 text-primary border-primary/40', punto: 'bg-primary' },
  rechazada: { texto: 'Pago rechazado', clase: 'bg-red-500/15 text-red-300 border-red-400/40', punto: 'bg-red-400' },
}

export function EstadoQuinielaBadge({ estado }: { estado: EstadoQuiniela }) {
  const e = ESTILO[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest whitespace-nowrap uppercase ${e.clase}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
      {e.texto}
    </span>
  )
}
