import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { pagosApi } from '../api/pagos'
import { usuariosApi } from '../api/perfil'

export type PendientesAdmin = {
  /** Registros esperando aprobación. */
  usuarios: number
  /** Comprobantes subidos que falta revisar. */
  enRevision: number
  /** Quinielas enviadas que esperan pago (sin comprobante o rechazado). */
  porCobrar: number
  total: number
}

const CADA_MS = 60_000

/**
 * Lo que el admin tiene pendiente por validar. Se refresca al cambiar de pantalla y cada minuto;
 * null mientras carga o si no es admin.
 */
export function usePendientesAdmin(activo: boolean): PendientesAdmin | null {
  const { pathname } = useLocation()
  const [pendientes, setPendientes] = useState<PendientesAdmin | null>(null)

  useEffect(() => {
    if (!activo) return
    let vivo = true
    const cargar = () =>
      Promise.all([usuariosApi.conteos(), pagosApi.listar('en_revision')])
        .then(([u, p]) => {
          if (!vivo) return
          const usuarios = u.pendiente ?? 0
          const enRevision = p.conteos.en_revision ?? 0
          const porCobrar = p.conteos.por_cobrar ?? 0
          setPendientes({ usuarios, enRevision, porCobrar, total: usuarios + enRevision + porCobrar })
        })
        .catch(() => {})
    cargar()
    const t = setInterval(cargar, CADA_MS)
    return () => {
      vivo = false
      clearInterval(t)
    }
  }, [activo, pathname])

  return activo ? pendientes : null
}
