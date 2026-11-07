import { useId, useState, type InputHTMLAttributes } from 'react'

import { Icono } from './Icono'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string
  icono: string
  error?: string
}

/** Campo de texto con ícono a la izquierda; si es contraseña, agrega el botón de mostrar/ocultar. */
export function Campo({ etiqueta, icono, error, type = 'text', ...resto }: Props) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const esPassword = type === 'password'

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="ml-1 text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">
        {etiqueta}
      </label>
      <div className="relative flex items-center">
        <Icono nombre={icono} className="pointer-events-none absolute left-4 text-primary/70" />
        <input
          id={id}
          type={esPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-black/40 py-4 pl-12 text-base text-white transition-all outline-none placeholder:text-white/20 focus:border-primary focus:ring-1 focus:ring-primary ${
            esPassword ? 'pr-12' : 'pr-4'
          } ${error ? 'border-red-400/70' : 'border-white/10'}`}
          {...resto}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition-colors hover:text-primary"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Icono nombre={visible ? 'visibility_off' : 'visibility'} className="text-xl!" />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="ml-1 text-xs font-medium text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
