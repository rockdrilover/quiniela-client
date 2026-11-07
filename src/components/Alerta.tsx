import type { ReactNode } from 'react'

import { Icono } from './Icono'

const ESTILOS = {
  error: { caja: 'border-red-400/40 bg-red-500/15 text-red-100', icono: 'error' },
  aviso: { caja: 'border-yellow-300/40 bg-yellow-400/10 text-yellow-100', icono: 'schedule' },
  exito: { caja: 'border-primary/40 bg-primary/10 text-green-100', icono: 'check_circle' },
} as const

export function Alerta({ tipo, children }: { tipo: keyof typeof ESTILOS; children: ReactNode }) {
  const e = ESTILOS[tipo]
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${e.caja}`}>
      <Icono nombre={e.icono} className="mt-px text-xl!" />
      <div className="flex-1">{children}</div>
    </div>
  )
}
