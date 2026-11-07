/** Ícono de Google Material Symbols (los mismos de las pantallas originales). */
export function Icono({ nombre, className = '' }: { nombre: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {nombre}
    </span>
  )
}
