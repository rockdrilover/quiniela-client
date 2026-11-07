import type { Equipo } from '../api/jornadas'

/** Círculo con las siglas del equipo y el nombre debajo (diseño de la especificación). */
export function EquipoChip({ equipo, alinear = 'centro' }: { equipo: Equipo; alinear?: 'centro' | 'izq' | 'der' }) {
  const lado = alinear === 'izq' ? 'items-start text-left' : alinear === 'der' ? 'items-end text-right' : 'items-center text-center'
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${lado}`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-black tracking-tight">
        {equipo.abreviatura}
      </div>
      <span className="w-full truncate text-xs font-semibold text-white/80">{equipo.nombre}</span>
    </div>
  )
}
