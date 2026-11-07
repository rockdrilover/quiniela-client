import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { Cargando } from '../components/Cargando'
import { useAuth } from './AuthContext'

/** Solo deja pasar con sesión iniciada (y, si se indica, con rol admin). Si no, manda al login. */
export function RutaProtegida({ children, soloAdmin = false }: { children: ReactNode; soloAdmin?: boolean }) {
  const { estado, usuario } = useAuth()
  const location = useLocation()

  if (estado === 'cargando') return <Cargando />
  if (estado === 'anonimo') return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (soloAdmin && usuario?.rol !== 'admin') return <Navigate to="/" replace />
  return children
}

/** Para login/registro: si ya hay sesión, va directo al inicio. */
export function SoloAnonimo({ children }: { children: ReactNode }) {
  const { estado } = useAuth()
  if (estado === 'cargando') return <Cargando />
  if (estado === 'autenticado') return <Navigate to="/" replace />
  return children
}
