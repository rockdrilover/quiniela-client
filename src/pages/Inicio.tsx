import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import type { Jornada } from '../api/jornadas'
import { quinielasApi, type MisQuinielas, type Quiniela } from '../api/quinielas'
import { useAuth } from '../auth/AuthContext'
import { Alerta } from '../components/Alerta'
import { EstadoJornadaBadge } from '../components/EstadoJornadaBadge'
import { EstadoQuinielaBadge } from '../components/EstadoQuinielaBadge'
import { Icono } from '../components/Icono'
import { fechaHoraCorta } from '../lib/fechas'

/** Pantalla 3: Mis Quinielas. */
export function Inicio() {
  const { usuario, actualizarUsuario } = useAuth()
  const [datos, setDatos] = useState<MisQuinielas | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    quinielasApi
      .mias()
      .then((d) => {
        if (!vivo) return
        setDatos(d)
        // Si el admin lo aprobó mientras tenía la app abierta, el token aún dice "pendiente": manda la BD
        actualizarUsuario({ estado: d.estadoUsuario })
      })
      .catch((e: Error) => vivo && setError(e.message))
    return () => {
      vivo = false
    }
  }, [actualizarUsuario])

  if (!usuario) return null

  const actual = datos?.actual ?? null
  const deActual = datos?.quinielas.filter((q) => q.idJornada === actual?.id) ?? []
  const anteriores = (datos?.jornadas ?? []).filter((j) => j.id !== actual?.id)

  return (
    <div className="space-y-8">
      {usuario.estado === 'pendiente' && (
        <Alerta tipo="aviso">
          Tu cuenta está <strong>pendiente de aprobación</strong>. Un administrador debe aprobarla para que puedas crear
          quinielas. Te avisaremos por correo.
        </Alerta>
      )}

      <div className="flex items-end justify-between gap-3">
        <h1 className="text-4xl leading-tight font-extrabold tracking-tighter italic drop-shadow-[0_0_30px_rgba(19,236,91,0.3)]">
          MIS <span className="text-primary">QUINIELAS</span>
        </h1>
        {actual && (
          <div className="shrink-0 pb-1 text-right">
            <p className="text-xs font-black tracking-[0.2em] text-primary uppercase">{actual.nombre}</p>
            <div className="mt-1">
              <EstadoJornadaBadge estado={actual.estadoVisual} />
            </div>
          </div>
        )}
      </div>

      {error && <Alerta tipo="error">{error}</Alerta>}
      {!datos && !error && <p className="text-center text-sm text-white/50">Cargando…</p>}

      {datos && (
        <section className="glass-card space-y-4 rounded-[2rem] p-5 shadow-2xl">
          {actual ? (
            <p className="flex items-center gap-2 text-xs text-white/60">
              <Icono nombre="schedule" className="text-base! text-primary" />
              {actual.aceptaPronosticos
                ? `Puedes capturar hasta el ${fechaHoraCorta(actual.fechaCierre!)}`
                : 'Los pronósticos de esta jornada ya están cerrados'}
              <span className="ml-auto font-bold text-white/80">${actual.precio} c/u</span>
            </p>
          ) : (
            <p className="py-4 text-center text-sm text-white/50">Todavía no hay una jornada publicada.</p>
          )}

          {actual && deActual.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center text-sm text-white/50">
              Aún no tienes quinielas en esta jornada.
            </p>
          )}
          <ul className="space-y-3">
            {deActual.map((q) => (
              <FilaQuiniela key={q.id} q={q} jornada={actual ?? undefined} />
            ))}
          </ul>

          {datos.puedeCrear ? (
            <Link
              to="/quinielas/nueva"
              className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 py-4 text-white/60 transition-all hover:border-primary/50 hover:bg-white/5 hover:text-white"
            >
              <Icono nombre="add_circle" className="transition-colors group-hover:text-primary" />
              <span className="text-sm font-bold tracking-widest uppercase">Nueva quiniela</span>
            </Link>
          ) : (
            actual &&
            datos.motivoNoPuedeCrear && <p className="text-center text-xs text-white/40">{datos.motivoNoPuedeCrear}</p>
          )}
        </section>
      )}

      {anteriores.map((j) => (
        <JornadaAnterior key={j.id} j={j} quinielas={datos!.quinielas.filter((q) => q.idJornada === j.id)} />
      ))}

      {usuario.rol === 'admin' && (
        <Link
          to="/admin"
          className="glass-card flex items-center gap-4 rounded-2xl p-5 transition-colors hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Icono nombre="admin_panel_settings" className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Panel de administración</p>
            <p className="text-xs text-white/50">Jornadas, pagos y usuarios</p>
          </div>
          <Icono nombre="chevron_right" className="text-white/40" />
        </Link>
      )}
    </div>
  )
}

function FilaQuiniela({ q, jornada }: { q: Quiniela; jornada?: Jornada }) {
  const completa = q.pronosticados >= q.totalPartidos
  return (
    <li>
      <Link
        to={`/quinielas/${q.id}`}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 transition-colors hover:border-primary/40"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Icono nombre="analytics" className="text-xl! text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold tracking-wider uppercase">Quiniela {q.numero}</p>
            <span className="text-[10px] font-bold text-white/40">#{q.folio}</span>
          </div>
          <EstadoQuinielaBadge estado={q.estado} jornada={jornada?.estadoVisual} />
          <p className="text-[10px] font-black tracking-wide text-white/40 uppercase">
            {completa ? `${q.totalPartidos} partidos` : `${q.pronosticados}/${q.totalPartidos} partidos`}
            {q.puntos !== null && <span className="ml-2 text-primary">{q.puntos} pts</span>}
          </p>
        </div>
        <span className="shrink-0 rounded-xl bg-primary px-3 py-2 text-[10px] font-extrabold text-fondo shadow-[0_5px_15px_rgba(19,236,91,0.2)]">
          {q.editable ? 'EDITAR' : 'VER DETALLE'}
        </span>
      </Link>
    </li>
  )
}

function JornadaAnterior({ j, quinielas }: { j: Jornada; quinielas: Quiniela[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black tracking-[0.2em] text-white/60 uppercase">{j.nombre}</h2>
        <EstadoJornadaBadge estado={j.estadoVisual} />
      </div>
      <ul className="space-y-3">
        {quinielas.map((q) => (
          <FilaQuiniela key={q.id} q={q} jornada={j} />
        ))}
      </ul>
    </section>
  )
}
