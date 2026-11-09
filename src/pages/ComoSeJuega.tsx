import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { Icono } from '../components/Icono'

/** Archivo generado con `npm run pdf` a partir de esta misma pantalla (modo ?imprimir). */
export const PDF_MANUAL = '/manual-quiniela-liga-mx.pdf'

const PASOS = [
  { titulo: 'Regístrate', texto: 'Crea tu cuenta en la app. El administrador la aprueba y te avisamos por correo.' },
  { titulo: 'Crea tu quiniela', texto: 'Pon el marcador de cada partido de la jornada. Puedes tener hasta 10 quinielas por jornada.' },
  { titulo: 'Envíala a tiempo', texto: 'Las quinielas se cierran en cuanto empieza el primer partido de la jornada.' },
  { titulo: 'Paga tu quiniela', texto: 'Sube la foto o PDF de tu comprobante, o págale en efectivo al administrador y él registra tu pago.' },
  { titulo: 'Sigue tus puntos', texto: 'En Resultados ves el ranking y tus puntos partido por partido.' },
]

const PREGUNTAS = [
  {
    p: '¿Puedo cambiar mi quiniela?',
    r: 'Sí. Puedes cambiar tus marcadores hasta que empiece el primer partido de la jornada, aunque ya la hayas enviado o pagado.',
  },
  {
    p: '¿Qué pasa si no pago mi quiniela?',
    r: 'Solo las quinielas con el pago validado aparecen en el ranking y suman puntos. Una quiniela sin pagar no compite.',
  },
  {
    p: '¿Qué pasa si un partido se suspende?',
    r: 'Ese partido no cuenta para nadie: no da ni quita puntos. Si era el primero de la jornada, el cierre pasa al siguiente partido.',
  },
  {
    p: '¿Cuándo veo los pronósticos de los demás?',
    r: 'En cuanto empieza el primer partido. Antes de eso cada quien ve solo los suyos, para que nadie copie.',
  },
  {
    p: '¿Puedo jugar varias quinielas?',
    r: 'Sí, hasta 10 por jornada. Cada una se paga por separado y compite por su cuenta en el ranking.',
  },
]

/**
 * Manual del jugador: cómo se juega y cómo se decide al ganador. Es pública para poder compartir el enlace.
 * Con ?imprimir se muestra en formato de documento (sin botones, preguntas abiertas) para generar el PDF.
 */
export function ComoSeJuega() {
  const [params] = useSearchParams()
  const imprimir = params.has('imprimir')
  const { usuario } = useAuth()

  return (
    <div className={`relative isolate min-h-dvh ${imprimir ? 'manual-imprimir bg-fondo' : ''}`}>
      <div className={`fondo-estadio -z-20 opacity-60 ${imprimir ? 'absolute' : 'fixed'} inset-0`} />
      <div className={`fondo-overlay -z-10 ${imprimir ? 'absolute' : 'fixed'} inset-0`} />

      {!imprimir && (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <Link
              to={usuario ? '/' : '/login'}
              className="flex h-10 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-white/70 transition-colors hover:border-primary hover:text-primary"
            >
              <Icono nombre="arrow_back" className="text-lg!" /> {usuario ? 'Volver' : 'Entrar'}
            </Link>
            <a
              href={PDF_MANUAL}
              download
              className="flex h-10 items-center gap-1.5 rounded-full border border-primary/60 bg-primary/10 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
            >
              <Icono nombre="download" className="text-lg!" /> Descargar PDF
            </a>
          </div>
        </header>
      )}

      <main className={`mx-auto max-w-2xl space-y-5 px-4 ${imprimir ? 'py-8' : 'pt-8 pb-16'}`}>
        {imprimir ? (
          <div className="manual-bloque flex items-center gap-4 pb-2">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary">
              <Icono nombre="sports_soccer" className="text-4xl! text-fondo" />
            </div>
            <div>
              <p className="text-xs font-black tracking-[0.3em] text-primary">QUINIELA LIGA MX</p>
              <h1 className="text-4xl leading-tight font-extrabold tracking-tighter italic">
                MANUAL DEL <span className="text-primary">JUGADOR</span>
              </h1>
              <p className="text-sm text-white/60">Cómo se juega y cómo se decide al ganador.</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-4xl leading-tight font-extrabold tracking-tighter italic drop-shadow-[0_0_30px_rgba(19,236,91,0.3)]">
              CÓMO SE <span className="text-primary">JUEGA</span>
            </h1>
            <p className="mt-1 text-sm text-white/60">Todo lo que necesitas saber para competir en cada jornada.</p>
          </div>
        )}

        <Seccion icono="checklist" titulo="Paso a paso">
          <ol className="space-y-4">
            {PASOS.map((s, i) => (
              <li key={s.titulo} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-fondo">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold">{s.titulo}</p>
                  <p className="text-sm text-white/65">{s.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </Seccion>

        <Seccion icono="scoreboard" titulo="¿Cómo se suman puntos?">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
              <p className="text-4xl font-black text-primary">1</p>
              <p className="mt-1 text-sm font-bold">Le atinaste al resultado</p>
              <p className="text-xs text-white/55">Ganador o empate, sea o no el marcador exacto</p>
            </div>
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center">
              <p className="text-4xl font-black text-red-300">0</p>
              <p className="mt-1 text-sm font-bold">Fallaste</p>
              <p className="text-xs text-white/55">No le atinaste a quién ganaba</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] font-black tracking-widest text-white/50 uppercase">Ejemplo · el partido terminó 2-1</p>
            <ul className="mt-3 space-y-2 text-sm">
              <Ejemplo marcador="2-1" puntos={1} texto="Marcador exacto" />
              <Ejemplo marcador="1-0" puntos={1} texto="También gana el local" />
              <Ejemplo marcador="0-0" puntos={0} texto="Pusiste empate" />
            </ul>
          </div>
          <p className="flex items-start gap-2 text-xs text-white/55">
            <Icono nombre="info" className="text-base! text-primary" />
            Los puntos cuentan cuando el partido termina y solo en quinielas con el pago validado.
          </p>
        </Seccion>

        <div className="manual-nueva-pagina">
          <Seccion icono="emoji_events" titulo="¿Quién gana?">
            <ol className="space-y-3">
              <Criterio n={1} texto="Gana la quiniela con más puntos en la jornada." />
              <Criterio n={2} texto="Si hay empate en puntos, gana la que tenga más marcadores exactos." />
              <Criterio n={3} texto="Si siguen empatadas, el premio se reparte en partes iguales entre ellas." />
            </ol>
          </Seccion>
        </div>

        <Seccion icono="help" titulo="Preguntas frecuentes">
          <div className="divide-y divide-white/10">
            {PREGUNTAS.map((q) => (
              <details key={q.p} open={imprimir} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
                  {q.p}
                  {!imprimir && <Icono nombre="expand_more" className="text-white/40 transition-transform group-open:rotate-180" />}
                </summary>
                <p className="mt-2 text-sm text-white/65">{q.r}</p>
              </details>
            ))}
          </div>
        </Seccion>

        {(imprimir || !usuario) && (
          <div className="manual-bloque glass-card flex items-center gap-4 rounded-[2rem] border-primary/40 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <Icono nombre="sports_soccer" className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold">¿Quieres jugar?</p>
              <p className="text-sm text-white/65">Pide tu invitación al administrador y regístrate en la app.</p>
            </div>
            {!imprimir && (
              <Link to="/registro" className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-black tracking-wider text-fondo uppercase">
                Registrarme
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function Seccion({ icono, titulo, children }: { icono: string; titulo: string; children: ReactNode }) {
  return (
    <section className="manual-bloque glass-card space-y-4 rounded-[2rem] p-5">
      <h2 className="flex items-center gap-2 text-sm font-black tracking-widest text-primary uppercase">
        <Icono nombre={icono} className="text-xl!" /> {titulo}
      </h2>
      {children}
    </section>
  )
}

function Ejemplo({ marcador, puntos, texto }: { marcador: string; puntos: number; texto: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 font-bold whitespace-nowrap">Pusiste {marcador}</span>
      <span className="flex-1 text-white/65">{texto}</span>
      <span className={`shrink-0 font-black ${puntos > 0 ? 'text-primary' : 'text-red-300'}`}>
        {puntos} {puntos === 1 ? 'pt' : 'pts'}
      </span>
    </li>
  )
}

function Criterio({ n, texto }: { n: number; texto: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/50 text-xs font-black text-primary">
        {n}
      </span>
      <span className="pt-0.5 text-sm">{texto}</span>
    </li>
  )
}
