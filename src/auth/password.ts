/** Mismas reglas que valida la API: 8 a 72 caracteres, al menos una letra y un número. */
export function reglasPassword(p: string) {
  return [
    { ok: p.length >= 8 && p.length <= 72, texto: 'Mínimo 8 caracteres' },
    { ok: /\p{L}/u.test(p), texto: 'Al menos una letra' },
    { ok: /\d/.test(p), texto: 'Al menos un número' },
  ]
}

export function passwordValida(p: string) {
  return reglasPassword(p).every((r) => r.ok)
}
