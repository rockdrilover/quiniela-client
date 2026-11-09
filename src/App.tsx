import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { AuthProvider } from './auth/AuthContext'
import { RutaProtegida, SoloAnonimo } from './auth/RutaProtegida'
import { AppLayout } from './components/AppLayout'
import { ConfirmarProvider } from './components/Confirmar'
import { AdminJornadas } from './pages/admin/AdminJornadas'
import { AdminInicio } from './pages/admin/AdminInicio'
import { AdminPagos } from './pages/admin/AdminPagos'
import { AdminUsuario } from './pages/admin/AdminUsuario'
import { AdminUsuarios } from './pages/admin/AdminUsuarios'
import { Perfil } from './pages/Perfil'
import { AdminPartidos } from './pages/admin/AdminPartidos'
import { Inicio } from './pages/Inicio'
import { Login } from './pages/Login'
import { Pronosticos } from './pages/Pronosticos'
import { Ranking } from './pages/Ranking'
import { Recuperar } from './pages/Recuperar'
import { Registro } from './pages/Registro'

export default function App() {
  return (
    <AuthProvider>
      <ConfirmarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<SoloAnonimo><Login /></SoloAnonimo>} />
            <Route path="/registro" element={<SoloAnonimo><Registro /></SoloAnonimo>} />
            <Route path="/recuperar" element={<Recuperar />} />

            <Route element={<RutaProtegida><AppLayout /></RutaProtegida>}>
              <Route path="/" element={<Inicio />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/quinielas/nueva" element={<Pronosticos />} />
              <Route path="/quinielas/:id" element={<Pronosticos />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/admin" element={<RutaProtegida soloAdmin><AdminInicio /></RutaProtegida>} />
              <Route path="/admin/usuarios" element={<RutaProtegida soloAdmin><AdminUsuarios /></RutaProtegida>} />
              <Route path="/admin/usuarios/:id" element={<RutaProtegida soloAdmin><AdminUsuario /></RutaProtegida>} />
              <Route path="/admin/jornadas" element={<RutaProtegida soloAdmin><AdminJornadas /></RutaProtegida>} />
              <Route path="/admin/jornadas/:id" element={<RutaProtegida soloAdmin><AdminPartidos /></RutaProtegida>} />
              <Route path="/admin/pagos" element={<RutaProtegida soloAdmin><AdminPagos /></RutaProtegida>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfirmarProvider>
    </AuthProvider>
  )
}
