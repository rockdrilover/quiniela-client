import { useEffect, useState, type ReactNode } from 'react'

import { Alerta } from './Alerta'
import { Icono } from './Icono'

/**
 * Modal que descarga un archivo protegido y lo muestra: imagen o PDF.
 * La URL temporal (blob:) se libera al cerrar.
 */
export function VisorArchivo(props: {
  titulo: string
  subtitulo?: string
  cargar: () => Promise<Blob>
  onCerrar: () => void
  /** Se llama cuando el archivo ya se mostró (el admin lo usa para habilitar "Validar"). */
  onCargado?: () => void
  pie?: ReactNode
}) {
  const { cargar, onCargado, onCerrar } = props
  const [archivo, setArchivo] = useState<{ url: string; tipo: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    let vivo = true
    cargar()
      .then((b) => {
        if (!vivo) return
        url = URL.createObjectURL(b)
        setArchivo({ url, tipo: b.type })
        onCargado?.()
      })
      .catch((e: Error) => vivo && setError(e.message))
    return () => {
      vivo = false
      if (url) URL.revokeObjectURL(url)
    }
    // Solo al abrir: cargar/onCargado cambian de identidad en cada render del padre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={props.titulo}
        className="glass-card flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-fondo/90 sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-wider uppercase">{props.titulo}</p>
            {props.subtitulo && <p className="truncate text-xs text-white/50">{props.subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:border-primary"
          >
            <Icono nombre="close" className="text-lg!" />
          </button>
        </div>

        <div className="flex min-h-64 flex-1 items-center justify-center overflow-auto bg-black/40 p-3">
          {error && <Alerta tipo="error">{error}</Alerta>}
          {!archivo && !error && <p className="text-sm text-white/50">Cargando comprobante…</p>}
          {archivo &&
            (archivo.tipo === 'application/pdf' ? (
              <iframe src={archivo.url} title={props.titulo} className="h-[65dvh] w-full rounded-xl bg-white" />
            ) : (
              <img src={archivo.url} alt={props.titulo} className="max-h-[65dvh] w-auto rounded-xl object-contain" />
            ))}
        </div>

        {props.pie && <div className="border-t border-white/10 p-4">{props.pie}</div>}
      </div>
    </div>
  )
}
