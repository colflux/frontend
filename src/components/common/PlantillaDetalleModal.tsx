import { useEffect, useState } from 'react'
import { datosService, type PlantillaDetalle } from '@/services/datos.service'
import { useAuthStore } from '@/store/useAuthStore'

interface Props {
  open: boolean
  onClose: () => void
}

const ATRIBUTOS_OBLIGATORIOS = new Set([
  'UnidadMuestreo.codigo_metadato',
  'Sitio.latitud',
  'Sitio.longitud',
  'SistemaReferencia.nombre',
])

export function PlantillaDetalleModal({ open, onClose }: Props) {
  const token = useAuthStore((s) => s.token)
  const [detalle, setDetalle] = useState<PlantillaDetalle | null>(null)
  const [hojaActiva, setHojaActiva] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cargando = open && !detalle && !error

  useEffect(() => {
    if (!open || detalle) return
    datosService
      .getPlantillaDetalle(token)
      .then((data) => {
        setDetalle(data)
        setHojaActiva(data.hojas[0]?.hoja ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle de la plantilla.'))
  }, [open, detalle, token])

  if (!open) return null

  const hoja = detalle?.hojas.find((h) => h.hoja === hojaActiva)

  return (
    <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-panel border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-fg">Detalle de la plantilla — Flujos CO2</h3>
            <p className="text-xs text-fg-muted mt-0.5">
              Qué trae cada hoja de la plantilla descargable: el atributo, su descripción y de qué
              entidad del modelo de datos sale.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-subtle hover:text-fg text-lg leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {cargando && <p className="text-sm text-fg-muted">Cargando…</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {detalle && (
          <>
            <div className="flex gap-2 border-b border-border">
              {detalle.hojas.map((h) => (
                <button
                  key={h.hoja}
                  type="button"
                  onClick={() => setHojaActiva(h.hoja)}
                  className={`text-xs font-semibold px-3 py-2 border-b-2 -mb-px ${
                    hojaActiva === h.hoja
                      ? 'border-brand-teal text-brand-teal dark:text-brand-teal-bright'
                      : 'border-transparent text-fg-muted hover:text-fg'
                  }`}
                >
                  {h.hoja}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 flex flex-col gap-2">
              {hoja?.atributos.map((a, i) => {
                const entidad = a.entidadAtributo.split('.')[0]
                return (
                  <div
                    key={`${a.entidadAtributo}-${i}`}
                    className="flex items-start gap-3 py-2 border-b border-border/60 last:border-0"
                  >
                    <span
                      className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: a.color ?? 'transparent' }}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                        {entidad}
                      </p>
                      <p className="text-sm font-semibold text-fg">
                        {a.campo}
                        {ATRIBUTOS_OBLIGATORIOS.has(a.entidadAtributo) && (
                          <span className="font-normal text-fg-muted"> (obligatorio)</span>
                        )}
                      </p>
                      {a.descripcion && <p className="text-xs text-fg-muted mt-0.5">{a.descripcion}</p>}
                      <p className="text-[11px] text-fg-subtle mt-0.5">
                        {a.entidadAtributo} · {a.tipoDato}
                        {a.valoresPermitidos && ` · Valores: ${a.valoresPermitidos}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
