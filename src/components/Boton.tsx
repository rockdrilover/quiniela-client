import type { ButtonHTMLAttributes } from 'react'

/** Botón verde principal de las pantallas (ENTRAR, REGISTRARSE, ENVIAR CÓDIGO...). */
export function BotonPrimario({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={`w-full rounded-xl bg-primary py-4 text-lg font-extrabold text-fondo shadow-[0_10px_20px_rgba(19,236,91,0.2)] transition-all hover:shadow-primary/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
      {...props}
    />
  )
}
