import { useEffect, useRef, useState } from 'react'

import { PRESETS_AVATAR, TIPOS_AVATAR, validarImagenAvatar, type EleccionAvatar } from '../lib/avatares'
import { Alerta } from './Alerta'
import { Avatar } from './Avatar'
import { Icono } from './Icono'

/**
 * Elegir avatar: uno predefinido, una foto propia o ninguno (iniciales).
 * Solo reporta la elección; quien lo usa decide cuándo guardarla.
 */
export function SelectorAvatar(props: {
  nombre: string
  /** Lo que ya tiene guardado ("preset:x", "/api/avatares/..." o null). */
  actual?: string | null
  eleccion: EleccionAvatar
  onElegir: (e: EleccionAvatar) => void
  /** Ofrecer "Usar mis iniciales" (en el perfil, para quitar el avatar). */
  permitirQuitar?: boolean
  ocupado?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<string | undefined>(undefined)
  const archivo = props.eleccion?.tipo === 'foto' ? props.eleccion.archivo : null

  // Vista previa local de la foto elegida
  useEffect(() => {
    if (!archivo) {
      setVista(undefined)
      return
    }
    const url = URL.createObjectURL(archivo)
    setVista(url)
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  function elegirFoto(f: File | undefined) {
    if (input.current) input.current.value = ''
    if (!f) return
    const e = validarImagenAvatar(f)
    setError(e)
    if (!e) props.onElegir({ tipo: 'foto', archivo: f })
  }

  const presetElegido = props.eleccion?.tipo === 'preset' ? props.eleccion.preset : null
  const muestra = props.eleccion === null ? props.actual : presetElegido ? `preset:${presetElegido}` : null // foto: va en src

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar nombre={props.nombre || '?'} avatar={muestra} src={vista} tamano="mediano" />
        <div className="flex flex-1 flex-wrap gap-2">
          <input ref={input} type="file" accept={TIPOS_AVATAR.join(',')} className="hidden" onChange={(e) => elegirFoto(e.target.files?.[0])} />
          <button
            type="button"
            disabled={props.ocupado}
            onClick={() => input.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-[11px] font-black tracking-wider text-primary uppercase hover:bg-primary/20 disabled:opacity-50"
          >
            <Icono nombre="add_a_photo" className="text-base!" /> Subir foto
          </button>
          {props.permitirQuitar && (props.actual || props.eleccion) && (
            <button
              type="button"
              disabled={props.ocupado}
              onClick={() => props.onElegir({ tipo: 'ninguno' })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-black tracking-wider text-white/70 uppercase hover:border-white/40 disabled:opacity-50"
            >
              <Icono nombre="text_fields" className="text-base!" /> Usar iniciales
            </button>
          )}
        </div>
      </div>

      <div className="grid max-w-md grid-cols-4 gap-3">
        {Object.entries(PRESETS_AVATAR).map(([clave, p]) => {
          const activo = presetElegido === clave || (props.eleccion === null && props.actual === `preset:${clave}`)
          return (
            <button
              key={clave}
              type="button"
              disabled={props.ocupado}
              aria-label={`Avatar ${clave}`}
              aria-pressed={activo}
              onClick={() => props.onElegir(activo && !props.permitirQuitar ? null : { tipo: 'preset', preset: clave })}
              className={`relative mx-auto flex aspect-square w-full max-w-20 items-center justify-center rounded-full border-2 transition-all disabled:opacity-50 ${p.fondo} ${
                activo ? 'border-primary ring-4 ring-primary/30' : 'border-white/10 hover:border-white/40'
              }`}
            >
              <Icono nombre={p.icono} className={`text-3xl! ${p.color}`} />
              {activo && (
                <span className="absolute -right-0.5 -bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-fondo">
                  <Icono nombre="check" className="text-base!" />
                </span>
              )}
            </button>
          )
        })}
      </div>
      {error && <Alerta tipo="error">{error}</Alerta>}
      <p className="text-[11px] text-white/40">Foto JPG, PNG o WEBP · máx. 2 MB. Si no eliges, se usan tus iniciales.</p>
    </div>
  )
}
