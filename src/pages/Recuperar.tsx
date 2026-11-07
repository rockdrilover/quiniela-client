import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { api, ApiError } from '../api/cliente'
import { Alerta } from '../components/Alerta'
import { AuthLayout } from '../components/AuthLayout'
import { BotonPrimario } from '../components/Boton'
import { Campo } from '../components/Campo'
import { Icono } from '../components/Icono'
import { passwordValida } from '../auth/password'
import { ReglasPassword } from '../components/ReglasPassword'

type Paso = 'correo' | 'codigo' | 'nueva' | 'listo'

const ESPERA_REENVIO = 60 // segundos antes de poder pedir otro código

/**
 * "¿Olvidaste tu contraseña?" en 3 pasos:
 *  1. correo  → la API manda un código de 6 dígitos (vence en 15 min)
 *  2. código  → se verifica
 *  3. nueva   → se cambia la contraseña (cierra las sesiones abiertas)
 */
export function Recuperar() {
  const [paso, setPaso] = useState<Paso>('correo')
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [errorCampo, setErrorCampo] = useState<string | undefined>()
  const [enviando, setEnviando] = useState(false)
  const [reenvioHasta, setReenvioHasta] = useState(0)
  const reenvioEn = useSegundosRestantes(reenvioHasta)

  async function ejecutar(fn: () => Promise<void>) {
    setEnviando(true)
    setError(null)
    setAviso(null)
    try {
      await fn()
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError(0, {})
      setError(apiErr.message)
      if (apiErr.codigo === 'CODIGO_INVALIDO' && paso === 'nueva') {
        // El código venció o se agotaron los intentos mientras escribía la contraseña
        setPaso('codigo')
        setCodigo('')
      }
    } finally {
      setEnviando(false)
    }
  }

  const pedirCodigo = () =>
    ejecutar(async () => {
      await api('/api/auth/recuperar', { metodo: 'POST', cuerpo: { correo: correo.trim() }, sinToken: true })
      setReenvioHasta(Date.now() + ESPERA_REENVIO * 1000)
      setCodigo('')
      setPaso('codigo')
    })

  function onCorreo(e: FormEvent) {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim())) {
      setErrorCampo('El correo no es válido')
      return
    }
    setErrorCampo(undefined)
    pedirCodigo()
  }

  function onCodigo(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(codigo)) {
      setErrorCampo('El código son 6 dígitos')
      return
    }
    setErrorCampo(undefined)
    ejecutar(async () => {
      await api('/api/auth/recuperar/verificar', { metodo: 'POST', cuerpo: { correo: correo.trim(), codigo }, sinToken: true })
      setPaso('nueva')
    })
  }

  function onNueva(e: FormEvent) {
    e.preventDefault()
    if (!passwordValida(nueva)) {
      setErrorCampo('La contraseña no cumple los requisitos')
      return
    }
    if (nueva !== confirmacion) {
      setErrorCampo('Las contraseñas no coinciden')
      return
    }
    setErrorCampo(undefined)
    ejecutar(async () => {
      await api('/api/auth/recuperar/restablecer', {
        metodo: 'POST',
        cuerpo: { correo: correo.trim(), codigo, nueva, confirmacion },
        sinToken: true,
      })
      setPaso('listo')
    })
  }

  function reenviar() {
    if (reenvioEn > 0 || enviando) return
    pedirCodigo().then(() => setAviso('Te enviamos un código nuevo. El anterior ya no funciona.'))
  }

  const volverAlLogin = (
    <p className="mt-8 text-center text-sm text-white/60">
      ¿Recordaste tu contraseña?{' '}
      <Link to="/login" className="font-bold text-primary transition-colors hover:text-white">
        Inicia sesión
      </Link>
    </p>
  )

  if (paso === 'correo') {
    return (
      <AuthLayout titulo="Recuperar contraseña" subtitulo="Ingresa tu correo para recibir un código de verificación.">
        <Pasos actual={1} />
        <form className="space-y-6" onSubmit={onCorreo} noValidate>
          {error && <Alerta tipo="error">{error}</Alerta>}
          <Campo
            etiqueta="Correo electrónico"
            icono="mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="tucorreo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            error={errorCampo}
            autoFocus
          />
          <BotonPrimario disabled={enviando}>{enviando ? 'ENVIANDO…' : 'ENVIAR CÓDIGO'}</BotonPrimario>
        </form>
        {volverAlLogin}
      </AuthLayout>
    )
  }

  if (paso === 'codigo') {
    return (
      <AuthLayout titulo="Revisa tu correo" subtitulo={`Si ${correo.trim()} tiene una cuenta, te llegó un código de 6 dígitos. Vence en 15 minutos.`}>
        <Pasos actual={2} />
        <form className="space-y-6" onSubmit={onCodigo} noValidate>
          {error && <Alerta tipo="error">{error}</Alerta>}
          {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
          <div className="flex flex-col gap-2">
            <label htmlFor="codigo" className="ml-1 text-[10px] font-extrabold tracking-[0.15em] text-white/60 uppercase">
              Código de verificación
            </label>
            <input
              id="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              aria-invalid={errorCampo ? true : undefined}
              className={`w-full rounded-xl border bg-black/40 py-4 text-center font-mono text-3xl tracking-[0.5em] text-white outline-none placeholder:text-white/20 focus:border-primary focus:ring-1 focus:ring-primary ${
                errorCampo ? 'border-red-400/70' : 'border-white/10'
              }`}
              autoFocus
            />
            {errorCampo && <p className="ml-1 text-xs font-medium text-red-300">{errorCampo}</p>}
          </div>
          <BotonPrimario disabled={enviando || codigo.length !== 6}>{enviando ? 'VERIFICANDO…' : 'VERIFICAR'}</BotonPrimario>
        </form>
        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <p className="text-white/50">¿No llegó? Revisa también Spam o Promociones.</p>
          <button
            type="button"
            onClick={reenviar}
            disabled={reenvioEn > 0 || enviando}
            className="font-bold text-primary transition-colors hover:text-white disabled:text-white/30"
          >
            {reenvioEn > 0 ? `Reenviar código en ${reenvioEn} s` : 'Reenviar código'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPaso('correo')
              setError(null)
              setAviso(null)
              setErrorCampo(undefined)
            }}
            className="text-white/50 transition-colors hover:text-white"
          >
            Cambiar correo
          </button>
        </div>
      </AuthLayout>
    )
  }

  if (paso === 'nueva') {
    return (
      <AuthLayout titulo="Nueva contraseña" subtitulo="Código correcto. Escribe tu nueva contraseña.">
        <Pasos actual={3} />
        <form className="space-y-5" onSubmit={onNueva} noValidate>
          {error && <Alerta tipo="error">{error}</Alerta>}
          <div className="space-y-2">
            <Campo
              etiqueta="Nueva contraseña"
              icono="lock"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              maxLength={72}
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              autoFocus
            />
            <ReglasPassword password={nueva} />
          </div>
          <Campo
            etiqueta="Confirmar contraseña"
            icono="lock_reset"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            maxLength={72}
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            error={errorCampo}
          />
          <BotonPrimario disabled={enviando}>{enviando ? 'GUARDANDO…' : 'CAMBIAR CONTRASEÑA'}</BotonPrimario>
        </form>
        {volverAlLogin}
      </AuthLayout>
    )
  }

  return (
    <AuthLayout titulo="¡Listo!">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <Icono nombre="check_circle" className="text-5xl! text-primary" />
        </div>
        <p className="text-sm text-white/70">
          Tu contraseña se cambió. Por seguridad cerramos las sesiones abiertas en otros dispositivos.
        </p>
        <Link
          to="/login"
          className="w-full rounded-xl bg-primary py-4 text-center text-lg font-extrabold text-fondo shadow-[0_10px_20px_rgba(19,236,91,0.2)] transition-all active:scale-[0.97]"
        >
          INICIAR SESIÓN
        </Link>
      </div>
    </AuthLayout>
  )
}

function Pasos({ actual }: { actual: 1 | 2 | 3 }) {
  return (
    <ol className="mb-6 flex items-center justify-center gap-2" aria-label={`Paso ${actual} de 3`}>
      {[1, 2, 3].map((n) => (
        <li key={n} className={`h-1.5 rounded-full transition-all ${n <= actual ? 'w-8 bg-primary' : 'w-4 bg-white/15'}`} />
      ))}
    </ol>
  )
}

function useSegundosRestantes(hasta: number) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    if (hasta <= Date.now()) return
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [hasta])
  return Math.max(0, Math.ceil((hasta - ahora) / 1000))
}
