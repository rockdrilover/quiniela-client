import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { ApiError } from '../api/cliente'
import { perfilApi } from '../api/perfil'
import { useAuth, type DatosRegistro } from '../auth/AuthContext'
import { Alerta } from '../components/Alerta'
import { AuthLayout } from '../components/AuthLayout'
import { BotonPrimario } from '../components/Boton'
import { Campo } from '../components/Campo'
import { Icono } from '../components/Icono'
import { passwordValida } from '../auth/password'
import { ReglasPassword } from '../components/ReglasPassword'
import { SelectorAvatar } from '../components/SelectorAvatar'
import type { EleccionAvatar } from '../lib/avatares'

type Errores = Partial<Record<keyof DatosRegistro, string>>

const VACIO: DatosRegistro = { nombre: '', username: '', correo: '', password: '', confirmacion: '' }

/** Mismas reglas que la API, para avisar antes de enviar. */
function validar(d: DatosRegistro): Errores {
  const e: Errores = {}
  if (!d.nombre.trim()) e.nombre = 'Escribe tu nombre'
  else if (d.nombre.trim().length > 100) e.nombre = 'Máximo 100 caracteres'
  if (!/^[A-Za-z0-9_.]{3,30}$/.test(d.username.trim()))
    e.username = 'De 3 a 30 caracteres: letras, números, punto o guion bajo (sin espacios)'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo.trim())) e.correo = 'El correo no es válido'
  if (!passwordValida(d.password)) e.password = 'La contraseña no cumple los requisitos'
  if (d.confirmacion !== d.password) e.confirmacion = 'Las contraseñas no coinciden'
  return e
}

export function Registro() {
  const { registrar, actualizarUsuario } = useAuth()
  const [avatar, setAvatar] = useState<EleccionAvatar>(null)
  const navigate = useNavigate()
  const [datos, setDatos] = useState(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo: keyof DatosRegistro) => (e: ChangeEvent<HTMLInputElement>) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }))
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const v = validar(datos)
    setErrores(v)
    setError(null)
    if (Object.values(v).some(Boolean)) return

    setEnviando(true)
    try {
      await registrar({
        ...datos,
        nombre: datos.nombre.trim(),
        username: datos.username.trim(),
        correo: datos.correo.trim(),
      })
      // La cuenta ya existe: si el avatar falla no lo bloqueamos, lo puede cambiar después en su perfil
      if (avatar && avatar.tipo !== 'ninguno') {
        try {
          const p = await perfilApi.guardarAvatar(avatar)
          actualizarUsuario({ avatar: p.usuario.avatar })
        } catch {
          /* se queda con sus iniciales */
        }
      }
      navigate('/', { replace: true })
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError(0, {})
      if (apiErr.codigo === 'USERNAME_EN_USO') setErrores({ username: apiErr.message })
      else if (apiErr.codigo === 'CORREO_EN_USO') setErrores({ correo: apiErr.message })
      else if (apiErr.campos) setErrores(apiErr.campos as Errores)
      else setError(apiErr.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Registro de Usuario">
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        {error && <Alerta tipo="error">{error}</Alerta>}

        <Campo
          etiqueta="Nombre completo"
          icono="badge"
          name="nombre"
          autoComplete="name"
          placeholder="Escribe tu nombre"
          maxLength={100}
          value={datos.nombre}
          onChange={cambiar('nombre')}
          error={errores.nombre}
          autoFocus
        />

        <div className="space-y-1.5">
          <Campo
            etiqueta="Nombre de usuario"
            icono="alternate_email"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ej. pepe_gol"
            maxLength={30}
            value={datos.username}
            onChange={cambiar('username')}
            error={errores.username}
          />
          {!errores.username && <p className="ml-1 text-xs text-white/40">Es el nombre que verán los demás en el ranking.</p>}
        </div>

        <div className="space-y-2">
          <span className="ml-1 text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">Avatar (opcional)</span>
          <SelectorAvatar nombre={datos.nombre} eleccion={avatar} onElegir={setAvatar} ocupado={enviando} />
        </div>

        <Campo
          etiqueta="Correo electrónico"
          icono="mail"
          type="email"
          name="correo"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="ejemplo@correo.com"
          value={datos.correo}
          onChange={cambiar('correo')}
          error={errores.correo}
        />

        <div className="space-y-2">
          <Campo
            etiqueta="Contraseña"
            icono="lock"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            maxLength={72}
            value={datos.password}
            onChange={cambiar('password')}
            error={errores.password}
          />
          <ReglasPassword password={datos.password} />
        </div>

        <Campo
          etiqueta="Confirmar contraseña"
          icono="lock_reset"
          type="password"
          name="confirmacion"
          autoComplete="new-password"
          placeholder="••••••••"
          maxLength={72}
          value={datos.confirmacion}
          onChange={cambiar('confirmacion')}
          error={errores.confirmacion}
        />

        <div className="space-y-4 pt-2">
          <BotonPrimario disabled={enviando}>{enviando ? 'CREANDO CUENTA…' : 'REGISTRARSE'}</BotonPrimario>
          <div className="text-center">
            <Link to="/login" className="text-sm font-bold tracking-widest text-white/60 uppercase transition-colors hover:text-white">
              Cancelar
            </Link>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-white/50">
        Tu cuenta quedará pendiente hasta que un administrador la apruebe.
      </p>
      <Link
        to="/como-se-juega"
        className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-white/50 transition-colors hover:text-primary"
      >
        <Icono nombre="menu_book" className="text-base!" /> ¿Cómo se juega?
      </Link>
    </AuthLayout>
  )
}
