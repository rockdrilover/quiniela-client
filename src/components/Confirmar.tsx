import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

import { Icono } from './Icono'

export type OpcionesConfirmar = {
  titulo: string
  mensaje: ReactNode
  /** Texto del botón que confirma (por defecto "Confirmar"). */
  confirmar?: string
  cancelar?: string
  /** "peligro" pinta el botón en rojo (eliminar, bloquear, cerrar...). */
  tono?: 'normal' | 'peligro'
  icono?: string
}

type Pendiente = OpcionesConfirmar & { resolver: (ok: boolean) => void }

const ConfirmarContext = createContext<((o: OpcionesConfirmar) => Promise<boolean>) | null>(null)

/** Reemplazo de window.confirm con el diseño de la app: `if (!(await confirmar({...}))) return`. */
export function useConfirmar() {
  const ctx = useContext(ConfirmarContext)
  if (!ctx) throw new Error('useConfirmar requiere ConfirmarProvider')
  return ctx
}

export function ConfirmarProvider({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)

  const confirmar = useCallback(
    (o: OpcionesConfirmar) =>
      new Promise<boolean>((resolver) => {
        setPendiente((anterior) => {
          anterior?.resolver(false)
          return { ...o, resolver }
        })
      }),
    [],
  )

  const cerrar = useCallback((ok: boolean) => {
    setPendiente((p) => {
      p?.resolver(ok)
      return null
    })
  }, [])

  return (
    <ConfirmarContext.Provider value={confirmar}>
      {children}
      {pendiente && <DialogoConfirmar o={pendiente} onCerrar={cerrar} />}
    </ConfirmarContext.Provider>
  )
}

function DialogoConfirmar({ o, onCerrar }: { o: OpcionesConfirmar; onCerrar: (ok: boolean) => void }) {
  const peligro = o.tono === 'peligro'
  const botonOk = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    botonOk.current?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar(false)
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => onCerrar(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        className="glass-card w-full max-w-sm space-y-5 rounded-t-[2rem] bg-fondo/95 p-6 sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              peligro ? 'bg-red-500/15 text-red-300' : 'bg-primary/15 text-primary'
            }`}
          >
            <Icono nombre={o.icono ?? (peligro ? 'warning' : 'help')} />
          </div>
          <div className="min-w-0 space-y-1.5 pt-1">
            <p id="confirmar-titulo" className="text-base font-black tracking-wide uppercase">
              {o.titulo}
            </p>
            <div className="text-sm leading-relaxed text-white/70">{o.mensaje}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onCerrar(false)}
            className="rounded-xl border border-white/15 bg-white/5 py-3.5 text-xs font-black tracking-widest text-white/80 uppercase transition-colors hover:border-white/40"
          >
            {o.cancelar ?? 'Cancelar'}
          </button>
          <button
            ref={botonOk}
            type="button"
            onClick={() => onCerrar(true)}
            className={`rounded-xl py-3.5 text-xs font-black tracking-widest uppercase transition-all active:scale-[0.97] ${
              peligro
                ? 'bg-red-500 text-white shadow-[0_8px_20px_rgba(239,68,68,0.25)] hover:bg-red-400'
                : 'bg-primary text-fondo shadow-[0_8px_20px_rgba(19,236,91,0.25)]'
            }`}
          >
            {o.confirmar ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Misma pregunta en la lista de usuarios y en el detalle. */
export function confirmarBloqueo(username: string): OpcionesConfirmar {
  return {
    titulo: 'Bloquear usuario',
    mensaje: (
      <>
        Se cerrarán las sesiones de <strong>@{username}</strong> y no podrá entrar.
      </>
    ),
    confirmar: 'Bloquear',
    tono: 'peligro',
    icono: 'block',
  }
}
