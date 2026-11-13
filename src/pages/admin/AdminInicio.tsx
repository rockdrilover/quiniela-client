import { Link } from 'react-router'

import { Icono } from '../../components/Icono'
import { usePendientesAdmin } from '../../lib/usePendientesAdmin'

const plural = (n: number, palabra: string) => `${n} ${palabra}${n === 1 ? '' : 's'}`

/** Panel de administración: accesos con lo que está esperando revisión. */
export function AdminInicio() {
  const pendientes = usePendientesAdmin(true)
  const pagos = (pendientes?.enRevision ?? 0) + (pendientes?.porCobrar ?? 0)
  const resumen = pendientes
    ? [
        pendientes.enRevision > 0 && `${plural(pendientes.enRevision, 'comprobante')} por revisar`,
        pendientes.porCobrar > 0 && `${plural(pendientes.porCobrar, 'quiniela')} por cobrar`,
        pendientes.usuarios > 0 && `${plural(pendientes.usuarios, 'registro')} por aprobar`,
      ].filter(Boolean)
    : []

  const accesos = [
    { a: '/admin/torneos', icono: 'emoji_events', titulo: 'Torneos', texto: 'Crea torneos (Apertura, Clausura…) e inicia o finaliza cada uno' },
    { a: '/admin/jornadas', icono: 'calendar_month', titulo: 'Jornadas y partidos', texto: 'Crea jornadas, arma partidos y captura resultados' },
    { a: '/admin/pagos', icono: 'payments', titulo: 'Validación de pagos', texto: 'Revisa comprobantes y valida quinielas', aviso: pagos },
    { a: '/admin/usuarios', icono: 'group', titulo: 'Usuarios', texto: 'Aprueba registros, bloquea o edita cuentas', aviso: pendientes?.usuarios },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Hola, Administrador</p>
        <h1 className="text-4xl leading-tight font-extrabold tracking-tighter italic">
          PANEL <span className="text-primary drop-shadow-[0_0_20px_rgba(19,236,91,0.5)]">ADMIN</span>
        </h1>
      </div>
      {resumen.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
          <Icono nombre="notifications_active" className="text-yellow-300" />
          <div>
            <p className="font-bold">Tienes pendientes por validar</p>
            <p className="text-xs text-yellow-100/80">{resumen.join(' · ')}</p>
          </div>
        </div>
      )}
      <ul className="space-y-3">
        {accesos.map((x) => (
          <li key={x.a}>
            <Link to={x.a} className="glass-card flex items-center gap-4 rounded-2xl p-5 transition-colors hover:border-primary/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Icono nombre={x.icono} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{x.titulo}</p>
                <p className="text-xs text-white/50">{x.texto}</p>
              </div>
              {!!x.aviso && (
                <span className="rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-black text-fondo" title="Por revisar">
                  {x.aviso}
                </span>
              )}
              <Icono nombre="chevron_right" className="text-white/40" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
