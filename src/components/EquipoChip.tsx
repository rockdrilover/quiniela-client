import type { Equipo } from '../api/jornadas'
import { LogoEquipo } from './LogoEquipo'

/** Escudo del equipo en un círculo y el nombre debajo. */
export function EquipoChip({ equipo, alinear = 'centro' }: { equipo: Equipo; alinear?: 'centro' | 'izq' | 'der' }) {
  const lado = alinear === 'izq' ? 'items-start text-left' : alinear === 'der' ? 'items-end text-right' : 'items-center text-center'
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${lado}`}>
      <LogoEquipo equipo={equipo} />
      <span className="w-full truncate text-xs font-semibold text-white/80">{equipo.nombre}</span>
    </div>
  )
}
