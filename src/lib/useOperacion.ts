import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '../api/cliente'

type Mensaje = { tipo: 'exito' | 'error'; texto: string } | null

/**
 * Ejecuta acciones contra la API mostrando "ocupado", un mensaje de éxito (que se borra solo)
 * o el error que devuelva la API.
 */
export function useOperacion() {
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const ejecutar = useCallback(async <T,>(clave: string, fn: () => Promise<T>, exito?: string): Promise<T | undefined> => {
    setOcupado(clave)
    setMensaje(null)
    clearTimeout(timer.current)
    try {
      const r = await fn()
      if (exito) {
        setMensaje({ tipo: 'exito', texto: exito })
        timer.current = setTimeout(() => setMensaje(null), 3500)
      }
      return r
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof ApiError ? err.message : 'Ocurrió un error inesperado' })
      return undefined
    } finally {
      setOcupado(null)
    }
  }, [])

  const error = useCallback((texto: string) => setMensaje({ tipo: 'error', texto }), [])

  return { ocupado, mensaje, ejecutar, error, limpiar: () => setMensaje(null) }
}
