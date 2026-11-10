import { useEffect, useId, useRef, useState } from 'react'

import type { Equipo } from '../api/jornadas'
import { Icono } from './Icono'
import { LogoEquipo } from './LogoEquipo'

/**
 * Combo de equipos con escudo, en el estilo de la app (reemplaza al <select> nativo).
 * Los equipos que ya juegan en la jornada salen deshabilitados con la etiqueta "ya juega".
 */
export function SelectorEquipo(props: {
  valor: number | ''
  equipos: Equipo[]
  deshabilitados: Set<number>
  yaJuegan: Set<number>
  placeholder: string
  /** Lado hacia el que se abre la lista (el combo de la derecha abre hacia la izquierda). */
  alinear?: 'izq' | 'der'
  bloqueado?: boolean
  onCambio: (id: number) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const idLista = useId()
  const elegido = props.equipos.find((e) => e.id === props.valor)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    lista.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        disabled={props.bloqueado}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-label={props.placeholder}
        onClick={() => setAbierto((a) => !a)}
        className={`flex h-14 w-full min-w-0 items-center gap-2 rounded-xl border bg-black/40 pr-2 pl-2 text-left text-sm text-white transition-colors outline-none focus-visible:border-primary disabled:opacity-60 ${
          abierto ? 'border-primary ring-1 ring-primary' : 'border-white/10 hover:border-white/30'
        }`}
      >
        {elegido ? (
          <>
            <LogoEquipo equipo={elegido} tamano="mediano" />
            <span className="min-w-0 flex-1 truncate font-bold">{elegido.nombre}</span>
          </>
        ) : (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-white/20">
              <Icono nombre="shield" className="text-lg! text-white/30" />
            </span>
            <span className="min-w-0 flex-1 truncate text-white/40">{props.placeholder}</span>
          </>
        )}
        {!props.bloqueado && <Icono nombre={abierto ? 'expand_less' : 'expand_more'} className="text-xl! text-primary" />}
      </button>

      {abierto && (
        <ul
          ref={lista}
          id={idLista}
          role="listbox"
          aria-label={props.placeholder}
          className={`absolute top-full z-50 mt-2 max-h-72 w-64 max-w-[80vw] overflow-y-auto rounded-2xl border border-white/15 bg-[#0d1611]/95 p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl ${
            props.alinear === 'der' ? 'right-0' : 'left-0'
          }`}
        >
          {props.equipos.map((e) => {
            const off = props.deshabilitados.has(e.id)
            const activo = e.id === props.valor
            return (
              <li
                key={e.id}
                role="option"
                aria-selected={activo}
                aria-disabled={off}
                onClick={() => {
                  if (off) return
                  props.onCambio(e.id)
                  setAbierto(false)
                }}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm ${
                  off ? 'cursor-not-allowed opacity-35' : activo ? 'cursor-pointer bg-primary/15 text-primary' : 'cursor-pointer hover:bg-white/10'
                }`}
              >
                <LogoEquipo equipo={e} tamano="chico" />
                <span className="min-w-0 flex-1 truncate font-semibold">{e.nombre}</span>
                {props.yaJuegan.has(e.id) ? (
                  <span className="shrink-0 text-[9px] font-black tracking-wider text-white/50 uppercase">Ya juega</span>
                ) : (
                  activo && <Icono nombre="check" className="text-lg!" />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
