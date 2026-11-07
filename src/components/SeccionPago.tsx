import { useRef, useState } from 'react'

import { MAX_BYTES_COMPROBANTE, quinielasApi, type Pago, type Quiniela, type QuinielaDetalle } from '../api/quinielas'
import { useOperacion } from '../lib/useOperacion'
import { fechaHoraCorta } from '../lib/fechas'
import { Alerta } from './Alerta'
import { Icono } from './Icono'
import { VisorArchivo } from './VisorArchivo'

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

/** Pago de una quiniela enviada: subir comprobante, ver su estado y el motivo si lo rechazaron. */
export function SeccionPago({ q, pago, onActualizada }: { q: Quiniela; pago: Pago; onActualizada: (d: QuinielaDetalle) => void }) {
  const op = useOperacion()
  const input = useRef<HTMLInputElement>(null)
  const [verArchivo, setVerArchivo] = useState(false)
  const c = pago.comprobante

  async function subir(archivo: File | undefined) {
    if (input.current) input.current.value = ''
    if (!archivo) return
    if (!TIPOS.includes(archivo.type)) return op.error('Sube una foto (JPG, PNG o WEBP) o un PDF')
    if (archivo.size > MAX_BYTES_COMPROBANTE) return op.error('El archivo pesa más de 10 MB')
    const r = await op.ejecutar('subir', () => quinielasApi.subirComprobante(q.id, archivo), 'Comprobante enviado. Te avisaremos por correo cuando lo revisemos.')
    if (r) onActualizada(r)
  }

  const estado = (() => {
    switch (q.estado) {
      case 'participando':
        return { icono: 'verified', clase: 'text-primary', texto: 'Pago validado: tu quiniela está participando.' }
      case 'en_revision':
        return { icono: 'hourglass_top', clase: 'text-yellow-200', texto: 'Comprobante recibido. Estamos validando tu pago.' }
      case 'rechazada':
        return { icono: 'error', clase: 'text-red-300', texto: 'No pudimos validar tu comprobante.' }
      default:
        return { icono: 'payments', clase: 'text-yellow-200', texto: `Falta tu pago de $${q.monto} para participar.` }
    }
  })()

  return (
    <section className="glass-card space-y-4 rounded-[2rem] p-5">
      <div className="flex items-center gap-2">
        <Icono nombre="receipt_long" className="text-primary" />
        <h2 className="text-sm font-black tracking-widest uppercase">Pago</h2>
        <span className="ml-auto text-lg font-black">${q.monto}</span>
      </div>

      <p className={`flex items-start gap-2 text-sm ${estado.clase}`}>
        <Icono nombre={estado.icono} className="text-lg!" />
        <span>{estado.texto}</span>
      </p>

      {q.estado === 'rechazada' && c?.motivoRechazo && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <strong>Motivo:</strong> {c.motivoRechazo}
        </p>
      )}

      {c && (
        <button
          type="button"
          onClick={() => setVerArchivo(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm hover:border-primary/40"
        >
          <Icono nombre={c.mimeType === 'application/pdf' ? 'picture_as_pdf' : 'image'} className="text-white/60" />
          <span className="flex-1">
            Mi comprobante
            <span className="block text-xs text-white/40">Subido {fechaHoraCorta(c.subidoAt)}</span>
          </span>
          <Icono nombre="visibility" className="text-white/40" />
        </button>
      )}

      {op.mensaje && <Alerta tipo={op.mensaje.tipo}>{op.mensaje.texto}</Alerta>}

      {pago.puedeSubir && (
        <>
          <input
            ref={input}
            type="file"
            accept={TIPOS.join(',')}
            className="hidden"
            onChange={(e) => subir(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={op.ocupado !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-sm font-bold tracking-widest text-primary uppercase transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            <Icono nombre="upload" />
            {op.ocupado ? 'Subiendo…' : c ? 'Subir otro comprobante' : 'Subir comprobante'}
          </button>
          <p className="text-center text-[11px] text-white/40">Foto o PDF de tu transferencia o depósito · máx. 10 MB · antes del cierre</p>
        </>
      )}
      {!pago.puedeSubir && (q.estado === 'pendiente_pago' || q.estado === 'rechazada') && (
        <p className="text-center text-xs text-white/40">La jornada ya cerró: ya no se reciben pagos para esta quiniela.</p>
      )}

      {verArchivo && (
        <VisorArchivo
          titulo={`Comprobante · Quiniela ${q.numero}`}
          subtitulo={`Folio #${q.folio}`}
          cargar={() => quinielasApi.verComprobante(q.id)}
          onCerrar={() => setVerArchivo(false)}
        />
      )}
    </section>
  )
}
