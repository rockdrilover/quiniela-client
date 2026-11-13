import { NavLink, Outlet } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { usePendientesAdmin } from '../lib/usePendientesAdmin'
import { Avatar } from './Avatar'
import { Icono } from './Icono'

type ItemNav = { a: string; icono: string; texto: string; fin: boolean; aviso?: number }

/** Marco de las pantallas con sesión: encabezado arriba y barra de navegación abajo (estilo app móvil). */
export function AppLayout() {
  const { usuario, salir } = useAuth()
  if (!usuario) return null

  return (
    <div className="relative isolate min-h-dvh">
      <div className="fondo-foto fixed inset-0 -z-20" />
      <div className="fondo-overlay-claro fixed inset-0 -z-10" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <NavLink to="/perfil" aria-label="Mi perfil">
              <Avatar nombre={usuario.nombre} avatar={usuario.avatar} tamano="chico" />
            </NavLink>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.15em] text-white/60 uppercase">
                {usuario.rol === 'admin' ? 'Panel Admin' : 'Quiniela MX'}
              </p>
              <p className="truncate text-sm font-extrabold">{usuario.nombre}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={salir}
            className="flex h-10 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-white/70 transition-colors hover:border-primary hover:text-primary"
          >
            <Icono nombre="logout" className="text-lg!" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6 pb-32">
        <Outlet />
      </main>

      <NavInferior />
    </div>
  )
}

/** Barra de navegación de abajo; también la usa "Cómo se juega" cuando hay sesión. */
export function NavInferior() {
  const { usuario } = useAuth()
  const pendientes = usePendientesAdmin(usuario?.rol === 'admin')
  if (!usuario) return null

  const items: ItemNav[] = [
    { a: '/', icono: 'sports_soccer', texto: 'Quiniela', fin: true },
    { a: '/ranking', icono: 'leaderboard', texto: 'Resultados', fin: false },
    { a: '/como-se-juega', icono: 'menu_book', texto: 'Reglas', fin: false },
    ...(usuario.rol === 'admin'
      ? [{ a: '/admin', icono: 'admin_panel_settings', texto: 'Admin', fin: false, aviso: pendientes?.total }]
      : []),
    { a: '/perfil', icono: 'person', texto: 'Perfil', fin: false },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-2xl justify-around px-4 py-3">
        {items.map((i) => (
          <li key={i.a}>
            <NavLink
              to={i.a}
              end={i.fin}
              className={({ isActive }) =>
                `flex min-w-16 flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-white/40 hover:text-white/70'}`
              }
            >
              <span className="relative">
                <Icono nombre={i.icono} className="text-[26px]!" />
                {!!i.aviso && (
                  <span
                    className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] leading-none font-black text-fondo shadow-[0_0_12px_rgba(250,204,21,0.6)]"
                    aria-label={`${i.aviso} pendientes por validar`}
                    title="Pendientes por validar"
                  >
                    {i.aviso > 99 ? '99+' : i.aviso}
                  </span>
                )}
              </span>
              <span className="text-[9px] font-black tracking-tight uppercase">{i.texto}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
