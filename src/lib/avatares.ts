/** Avatares predefinidos: mismo listado que la API (AvatarService.PRESETS). */
export const PRESETS_AVATAR: Record<string, { icono: string; fondo: string; color: string }> = {
  balon: { icono: 'sports_soccer', fondo: 'bg-primary/15', color: 'text-primary' },
  trofeo: { icono: 'emoji_events', fondo: 'bg-yellow-400/15', color: 'text-yellow-300' },
  estrella: { icono: 'star', fondo: 'bg-amber-400/15', color: 'text-amber-300' },
  rayo: { icono: 'bolt', fondo: 'bg-sky-400/15', color: 'text-sky-300' },
  fuego: { icono: 'local_fire_department', fondo: 'bg-orange-500/15', color: 'text-orange-400' },
  escudo: { icono: 'shield', fondo: 'bg-indigo-400/15', color: 'text-indigo-300' },
  cohete: { icono: 'rocket_launch', fondo: 'bg-fuchsia-400/15', color: 'text-fuchsia-300' },
  medalla: { icono: 'military_tech', fondo: 'bg-rose-400/15', color: 'text-rose-300' },
}

export const MAX_BYTES_AVATAR = 2 * 1024 * 1024
export const TIPOS_AVATAR = ['image/jpeg', 'image/png', 'image/webp']

/** null si la imagen sirve; si no, el mensaje para el usuario. */
export function validarImagenAvatar(f: File): string | null {
  if (!TIPOS_AVATAR.includes(f.type)) return 'Sube una imagen JPG, PNG o WEBP'
  if (f.size > MAX_BYTES_AVATAR) return 'La imagen pesa más de 2 MB'
  return null
}

/** Lo que el usuario eligió y aún no se guarda (en el registro se aplica al crear la cuenta). */
export type EleccionAvatar = { tipo: 'preset'; preset: string } | { tipo: 'foto'; archivo: File } | { tipo: 'ninguno' } | null

export function iniciales(nombre: string) {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?'
  )
}
