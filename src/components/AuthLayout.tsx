import type { ReactNode } from 'react'

import { Icono } from './Icono'

const ICONOS_EQUIPOS = ['shield', 'swords', 'bolt', 'eco', 'castle', 'star', 'hotel_class']

/** Marco común de las pantallas de acceso (login, registro, recuperar): fondo, logo y tarjeta de vidrio. */
export function AuthLayout({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col items-center overflow-hidden px-4 py-10 sm:px-5">
      <div className="fondo-estadio absolute inset-0 -z-20 scale-105" />
      <div className="fondo-overlay absolute inset-0 -z-10" />

      <header className="mt-auto mb-10 flex flex-col items-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-[0_0_50px_rgba(19,236,91,0.5)]">
          <Icono nombre="sports_soccer" className="text-5xl! font-bold text-fondo" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          QUINIELA<span className="text-primary">MX</span>
        </h1>
        <p className="mt-1 text-sm font-semibold tracking-widest text-white/90 uppercase drop-shadow-md">
          Predicciones en Vivo
        </p>
      </header>

      <main className="glass-card w-full max-w-sm rounded-[2rem] p-6 shadow-2xl sm:p-8">
        <h2 className={`text-center text-2xl font-bold tracking-tight ${subtitulo ? 'mb-3' : 'mb-8'}`}>{titulo}</h2>
        {subtitulo && <p className="mb-8 text-center text-sm text-white/60">{subtitulo}</p>}
        {children}
      </main>

      <footer className="mt-auto w-full max-w-md pt-12">
        <p className="mb-6 text-center text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
          Equipos Liga BBVA MX
        </p>
        <div className="flex flex-wrap justify-center gap-5">
          {ICONOS_EQUIPOS.map((i) => (
            <div key={i} className="logo-glass flex h-10 w-10 items-center justify-center rounded-xl">
              <Icono nombre={i} className="text-lg! text-white/40" />
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
