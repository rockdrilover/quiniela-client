import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import { ApiError } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import { Alerta } from '../components/Alerta'
import { AuthLayout } from '../components/AuthLayout'
import { Campo } from '../components/Campo'

export function Login() {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const desde = (location.state as { desde?: string } | null)?.desde ?? '/'

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [erroresCampo, setErroresCampo] = useState<{ usuario?: string; password?: string }>({})
  const [esperaHasta, setEsperaHasta] = useState<number | null>(null)
  const restante = useCuentaRegresiva(esperaHasta)
  const bloqueado = restante > 0

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const faltan = {
      usuario: usuario.trim() ? undefined : 'Escribe tu correo o usuario',
      password: password ? undefined : 'Escribe tu contraseña',
    }
    setErroresCampo(faltan)
    if (faltan.usuario || faltan.password || bloqueado) return

    setEnviando(true)
    setError(null)
    try {
      await entrar(usuario.trim(), password)
      navigate(desde, { replace: true })
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError(0, {})
      if (apiErr.status === 429 && apiErr.reintentarEn) {
        setEsperaHasta(Date.now() + apiErr.reintentarEn * 1000)
      }
      if (apiErr.campos) setErroresCampo(apiErr.campos)
      setError(apiErr.message)
      setPassword('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Acceso a usuarios">
      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        {error && (
          <Alerta tipo={bloqueado ? 'aviso' : 'error'}>
            {bloqueado ? (
              <>
                Demasiados intentos fallidos. Podrás intentar de nuevo en <strong>{formatear(restante)}</strong>.{' '}
                <Link to="/recuperar" className="font-bold underline underline-offset-2">
                  Recuperar contraseña
                </Link>
              </>
            ) : (
              error
            )}
          </Alerta>
        )}

        <Campo
          etiqueta="Usuario o correo"
          icono="person"
          name="usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Nombre de usuario o correo"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          error={erroresCampo.usuario}
          autoFocus
        />

        <div>
          <Campo
            etiqueta="Contraseña"
            icono="lock"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={erroresCampo.password}
          />
          <div className="mt-2 flex justify-end">
            <Link to="/recuperar" className="text-xs font-semibold text-primary/80 transition-colors hover:text-primary">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={enviando || bloqueado}
          className="w-full rounded-xl bg-primary py-4 text-lg font-extrabold text-fondo shadow-[0_10px_20px_rgba(19,236,91,0.2)] transition-all hover:shadow-primary/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          {enviando ? 'ENTRANDO…' : bloqueado ? `ESPERA ${formatear(restante)}` : 'ENTRAR'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-white/60">
        ¿Aún no participas?{' '}
        <Link to="/registro" className="font-bold text-primary transition-colors hover:text-white">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  )
}

/** Segundos que faltan para "hasta" (se actualiza cada segundo). */
function useCuentaRegresiva(hasta: number | null) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    if (!hasta) return
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [hasta])
  return hasta ? Math.max(0, Math.ceil((hasta - ahora) / 1000)) : 0
}

function formatear(segundos: number) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
