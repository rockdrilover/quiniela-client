// Fechas: la API guarda y responde en UTC (ISO); aquí se muestran en la hora local del navegador.

const fmtCorto = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
const fmtDia = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' })

/** "sáb 15 nov, 19:00" */
export function fechaHoraCorta(iso: string) {
  return fmtCorto.format(new Date(iso)).replace('.', '')
}

/** "15 nov" */
export function diaCorto(iso: string) {
  return fmtDia.format(new Date(iso)).replace('.', '')
}

/** Valor para <input type="datetime-local"> en hora local: "2026-11-15T19:00" */
export function aInputLocal(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** De <input type="datetime-local"> (hora local) a ISO UTC para la API */
export function deInputLocal(valor: string) {
  return new Date(valor).toISOString()
}
