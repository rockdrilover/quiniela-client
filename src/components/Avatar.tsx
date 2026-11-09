import { useEffect, useState } from 'react'

import { iniciales, PRESETS_AVATAR } from '../lib/avatares'
import { Icono } from './Icono'

const TAMANOS = {
  grande: { caja: 'h-28 w-28 border-4 shadow-xl shadow-primary/10', texto: 'text-4xl', icono: 'text-6xl!' },
  mediano: { caja: 'h-16 w-16 border-2', texto: 'text-xl', icono: 'text-4xl!' },
  chico: { caja: 'h-10 w-10 border-2', texto: 'text-sm', icono: 'text-2xl!' },
  mini: { caja: 'h-7 w-7 border', texto: 'text-[10px]', icono: 'text-base!' },
}

/**
 * Círculo del usuario: su foto si subió una, el avatar predefinido que eligió o, si no tiene, sus iniciales.
 * avatar: "/api/avatares/..." | "preset:<nombre>" | null. `src` muestra una vista previa local (blob:).
 */
export function Avatar(props: { nombre: string; avatar?: string | null; src?: string; tamano?: keyof typeof TAMANOS }) {
  const t = TAMANOS[props.tamano ?? 'grande']
  const foto = props.src ?? (props.avatar?.startsWith('/api/') ? props.avatar : null)
  const preset = props.avatar?.startsWith('preset:') ? PRESETS_AVATAR[props.avatar.slice(7)] : undefined
  const [rota, setRota] = useState(false)

  useEffect(() => setRota(false), [foto])

  const base = `flex shrink-0 items-center justify-center overflow-hidden rounded-full ${t.caja}`

  if (foto && !rota) {
    return (
      <div className={`${base} border-primary/40 bg-black/40`}>
        <img src={foto} alt={props.nombre} className="h-full w-full object-cover" onError={() => setRota(true)} />
      </div>
    )
  }
  if (preset) {
    return (
      <div className={`${base} border-white/15 ${preset.fondo}`} aria-label={props.nombre} role="img">
        <Icono nombre={preset.icono} className={`${t.icono} ${preset.color}`} />
      </div>
    )
  }
  return (
    <div className={`${base} border-primary/40 bg-primary/10 font-black text-primary ${t.texto}`} aria-label={props.nombre} role="img">
      {iniciales(props.nombre)}
    </div>
  )
}
