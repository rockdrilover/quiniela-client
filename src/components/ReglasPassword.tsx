import { reglasPassword } from '../auth/password'
import { Icono } from './Icono'

/** Lista que se va palomeando mientras el usuario escribe la contraseña. */
export function ReglasPassword({ password }: { password: string }) {
  return (
    <ul className="ml-1 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Requisitos de la contraseña">
      {reglasPassword(password).map((r) => (
        <li key={r.texto} className={`flex items-center gap-1 ${r.ok ? 'text-primary' : 'text-white/40'}`}>
          <Icono nombre={r.ok ? 'check_circle' : 'radio_button_unchecked'} className="text-sm!" />
          {r.texto}
        </li>
      ))}
    </ul>
  )
}
