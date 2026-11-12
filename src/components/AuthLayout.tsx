import type { ReactNode } from 'react'

import { Icono } from './Icono'

/** Escudos de la Liga MX (archivos en public/equipos), empezando por el América. Fijos: esta pantalla es pública. */
const EQUIPOS = [
  ['AME', 'América'], ['ATE', 'Atlante'], ['ATS', 'Atlas'], ['ASL', 'Atlético de San Luis'], ['CAZ', 'Cruz Azul'],
  ['JUA', 'FC Juárez'], ['CHV', 'Guadalajara'], ['LEO', 'León'], ['MTY', 'Monterrey'], ['NEC', 'Necaxa'],
  ['PAC', 'Pachuca'], ['PUE', 'Puebla'], ['PUM', 'Pumas UNAM'], ['QRO', 'Querétaro'], ['SAN', 'Santos Laguna'],
  ['TIG', 'Tigres UANL'], ['TIJ', 'Tijuana'], ['TOL', 'Toluca'],
]

/** Marco común de las pantallas de acceso (login, registro, recuperar): fondo, logo y tarjeta de vidrio. */
export function AuthLayout({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col items-center overflow-hidden px-4 py-10 sm:px-5">
      <div className="fondo-foto absolute inset-0 -z-20" />
      <div className="fondo-overlay-claro absolute inset-0 -z-10" />

      <header className="mt-auto mb-10 flex flex-col items-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-[0_0_50px_rgba(19,236,91,0.5)]">
          <div className="balon-sombra absolute bottom-2 h-1.5 w-10 rounded-full bg-fondo/40 blur-[2px]" />
          <div className="balon-bota">
            <Icono nombre="sports_soccer" className="balon-gira block text-6xl! font-bold text-fondo" />
          </div>
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
        <div className="grid grid-cols-6 justify-items-center gap-3 sm:gap-4">
          {EQUIPOS.map(([clave, nombre]) => (
            <div key={clave} title={nombre} className="logo-glass flex h-11 w-11 items-center justify-center rounded-xl">
              <img src={`/equipos/${clave}.png`} alt={nombre} loading="lazy" className="h-7 w-7 object-contain opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
