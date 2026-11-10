import { useState } from 'react'

import type { Equipo } from '../api/jornadas'

const TAMANOS = {
  grande: 'h-12 w-12 text-xs',
  mediano: 'h-9 w-9 text-[10px]',
  chico: 'h-7 w-7 text-[9px]',
}

/** Escudo del equipo en un círculo. Si no hay logo (o no carga) se muestran sus siglas. */
export function LogoEquipo({ equipo, tamano = 'grande' }: { equipo: Equipo; tamano?: keyof typeof TAMANOS }) {
  const [fallo, setFallo] = useState(false)
  const conLogo = !!equipo.urlLogo && !fallo
  return (
    <div
      title={equipo.nombre}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border font-black tracking-tight ${TAMANOS[tamano]} ${
        conLogo ? 'border-white/20 bg-[radial-gradient(circle,rgba(255,255,255,0.22),rgba(255,255,255,0.06))]' : 'border-white/15 bg-white/5'
      }`}
    >
      {conLogo ? (
        <img src={equipo.urlLogo!} alt="" loading="lazy" onError={() => setFallo(true)} className="h-[74%] w-[74%] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
      ) : (
        equipo.abreviatura
      )}
    </div>
  )
}
