import { useRef, useState } from 'react'

import { MAX_BYTES_COMPROBANTE, quinielasApi, type Pago, type Quiniela, type QuinielaDetalle } from '../api/quinielas'
import { useOperacion } from '../lib/useOperacion'
import { fechaHoraCorta } from '../lib/fechas'
import { Alerta } from './Alerta'
import { Icono } from './Icono'
import { VisorArchivo } from './VisorArchivo'

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

/** null si el archivo sirve; si no, el mensaje para el usuario. */
function validarArchivo(archivo: File): string | null {
  if (!TIPOS.includes(archivo.type)) return 'Sube una foto (JPG, PNG o WEBP) o un PDF'
  if (archivo.size > MAX_BYTES_COMPROBANTE) return 'El archivo pesa más de 10 MB'
  return null
}

const AVISO_EFECTIVO = '¿Le pagaste en efectivo al administrador? No necesitas comprobante: él registrará tu pago.'

function Encabezado({ monto }: { monto: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icono nombre="receipt_long" className="text-primary" />
      <h2 className="text-sm font-black tracking-widest uppercase">Pago</h2>
      <span className="ml-auto text-lg font-black">${monto}</span>
    </div>
  )
}

/**
 * Pago antes de enviar: el comprobante es opcional. Si elige uno, se sube justo después de enviar
 * la quiniela; si no, puede subirlo luego o pagarle en efectivo al admin.
 */
export function PagoPrevio({ monto, archivo, onArchivo }: { monto: number; archivo: File | null; onArchivo: (f: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function elegir(f: File | undefined) {
    if (input.current) input.current.value = ''
    if (!f) return
    const e = validarArchivo(f)
    setError(e)
    if (!e) onArchivo(f)
  }

  return (
    <section className="glass-card space-y-4 rounded-[2rem] p-5">
      <Encabezado monto={monto} />
      <p className="text-sm text-white/70">
        Adjunta tu comprobante y se enviará junto con la quiniela. <span className="text-white/50">Es opcional:</span> también
        puedes subirlo después.
      </p>

      <input ref={input} type="file" accept={TIPOS.join(',')} className="hidden" onChange={(e) => elegir(e.target.files?.[0])} />
      {archivo ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
          <Icono nombre={archivo.type === 'application/pdf' ? 'picture_as_pdf' : 'image'} className="text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block truncate">{archivo.name}</span>
            <span className="block text-xs text-white/40">Se subirá al enviar la quiniela</span>
          </span>
          <button
            type="button"
            onClick={() => onArchivo(null)}
            aria-label="Quitar comprobante"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:text-red-300"
          >
            <Icono nombre="close" className="text-lg!" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-sm font-bold tracking-widest text-primary uppercase transition-colors hover:bg-primary/10"
        >
          <Icono nombre="attach_file" /> Adjuntar comprobante
        </button>
      )}
      {error && <Alerta tipo="error">{error}</Alerta>}
      <p className="text-center text-[11px] text-white/40">Foto o PDF de tu transferencia o depósito · máx. 10 MB</p>
      <p className="flex items-start gap-2 rounded-xl bg-white/5 px-4 py-3 text-xs text-white/60">
        <Icono nombre="payments" className="text-base! text-primary" />
        <span>{AVISO_EFECTIVO}</span>
      </p>
    </section>
  )
}

/** Pago de una quiniela enviada: subir comprobante, ver su estado y el motivo si lo rechazaron. */
export function SeccionPago({ q, pago, onActualizada }: { q: Quiniela; pago: Pago; onActualizada: (d: QuinielaDetalle) => void }) {
  const op = useOperacion()
  const input = useRef<HTMLInputElement>(null)
  const [verArchivo, setVerArchivo] = useState(false)
  const c = pago.comprobante
  const manual = c?.tipo === 'manual'

  async function subir(archivo: File | undefined) {
    if (input.current) input.current.value = ''
    if (!archivo) return
    const e = validarArchivo(archivo)
    if (e) return op.error(e)
    const r = await op.ejecutar('subir', () => quinielasApi.subirComprobante(q.id, archivo), cambiar ? 'Comprobante actualizado. Te avisaremos por correo cuando lo revisemos.' : 'Comprobante enviado. Te avisaremos por correo cuando lo revisemos.')
    if (r) onActualizada(r)
  }

  const estado = (() => {
    switch (q.estado) {
      case 'participando':
        return {
          icono: 'verified',
          clase: 'text-primary',
          texto: manual ? 'El administrador registró tu pago: tu quiniela está participando.' : 'Pago validado: tu quiniela está participando.',
        }
      case 'en_revision':
        return { icono: 'hourglass_top', clase: 'text-yellow-200', texto: 'Comprobante recibido. Estamos validando tu pago.' }
      case 'rechazada':
        return { icono: 'error', clase: 'text-red-300', texto: 'No pudimos validar tu comprobante.' }
      default:
        return { icono: 'payments', clase: 'text-yellow-200', texto: `Falta tu pago de $${q.monto} para participar.` }
    }
  })()

  const esperaPago = q.estado === 'pendiente_pago' || q.estado === 'rechazada'
  // Se equivocó de archivo: puede cambiarlo mientras el admin no lo haya revisado
  const cambiar = q.estado === 'en_revision' && !!c

  return (
    <section className="glass-card space-y-4 rounded-[2rem] p-5">
      <Encabezado monto={q.monto} />

      <p className={`flex items-start gap-2 text-sm ${estado.clase}`}>
        <Icono nombre={estado.icono} className="text-lg!" />
        <span>{estado.texto}</span>
      </p>

      {q.estado === 'rechazada' && c?.motivoRechazo && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <strong>Motivo:</strong> {c.motivoRechazo}
        </p>
      )}

      {c && !manual && (
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
            <Icono nombre={cambiar ? 'swap_horiz' : 'upload'} />
            {op.ocupado ? 'Subiendo…' : cambiar ? 'Cambiar comprobante' : c ? 'Subir otro comprobante' : 'Subir comprobante'}
          </button>
          <p className="text-center text-[11px] text-white/40">
            {cambiar
              ? '¿Te equivocaste de archivo? Cámbialo mientras no lo revisemos · máx. 10 MB'
              : 'Foto o PDF de tu transferencia o depósito · máx. 10 MB · antes del cierre'}
          </p>
        </>
      )}
      {esperaPago && (
        <p className="flex items-start gap-2 rounded-xl bg-white/5 px-4 py-3 text-xs text-white/60">
          <Icono nombre="payments" className="text-base! text-primary" />
          <span>{AVISO_EFECTIVO}</span>
        </p>
      )}
      {!pago.puedeSubir && esperaPago && (
        <p className="text-center text-xs text-white/40">La jornada ya cerró: ya no se pueden subir comprobantes para esta quiniela.</p>
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
