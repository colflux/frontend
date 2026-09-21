import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useReglaDetalle } from '@/hooks/useReglaDetalle'
import { useActualizarParametrosRegla, useAplicarRegla, useDeshacerLoteRegla } from '@/hooks/useReglaMutations'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'

const inputClass =
  'bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal w-56'

function contextoLegible(contexto: Record<string, string | number | null> & { caso?: string }) {
  const { caso: _caso, ...resto } = contexto
  return Object.entries(resto)
    .map(([k, v]) => `${k}: ${v ?? '—'}`)
    .join(' · ')
}

export function EtlReglaDetalle() {
  const [searchParams] = useSearchParams()
  const codigo = searchParams.get('codigo')
  const fuenteId = searchParams.get('fuente')
  const cargaId = searchParams.get('carga')

  const { data: d, isLoading, isError, error } = useReglaDetalle(codigo)
  const actualizarParametros = useActualizarParametrosRegla(codigo ?? '')
  const aplicarRegla = useAplicarRegla(codigo ?? '')
  const deshacerLote = useDeshacerLoteRegla(codigo ?? '')

  const [parametros, setParametros] = useState<Record<string, string>>({})
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [confirmandoAplicar, setConfirmandoAplicar] = useState(false)
  const [loteConfirmandoDeshacer, setLoteConfirmandoDeshacer] = useState<string | null>(null)

  useEffect(() => {
    if (d) setParametros(d.parametros)
  }, [d])

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'etl-regla-detalle',
    steps: [
      {
        element: '[data-tour="regladetalle-parametros"]',
        popover: {
          title: 'Parámetros de cálculo',
          description: 'Ajusta los valores que usa la regla. El ejemplo de abajo se recalcula al guardar.',
        },
      },
      {
        element: '[data-tour="regladetalle-ejemplo"]',
        popover: {
          title: 'Ejemplo por caso',
          description: 'Muestra cómo quedarían los registros pendientes agrupados según qué condición les aplica.',
        },
      },
      {
        element: '[data-tour="regladetalle-aplicar"]',
        popover: {
          title: 'Aplicar la regla',
          description: 'Aplica el cambio a todos los registros pendientes en la base de datos.',
        },
      },
      {
        element: '[data-tour="regladetalle-historial"]',
        popover: {
          title: 'Historial',
          description: 'Aplicaciones anteriores de esta regla, con la opción de deshacer un lote.',
        },
      },
    ],
  })

  if (!codigo) {
    return (
      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          Falta indicar la regla (parámetro ?codigo= en la URL).
        </div>
      </div>
    )
  }

  if (isLoading || !d) {
    return (
      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        {isError ? (
          <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
            Error al cargar la regla: {error instanceof Error ? error.message : 'error desconocido'}
          </div>
        ) : (
          <div className="text-center text-fg-muted text-sm py-10">Cargando regla…</div>
        )}
      </div>
    )
  }

  async function handleGuardarParametros() {
    try {
      await actualizarParametros.mutateAsync(parametros)
      setMensaje({ ok: true, texto: 'Parámetros guardados. El ejemplo se recalculó con los nuevos valores.' })
    } catch (err) {
      setMensaje({ ok: false, texto: `Error al guardar: ${err instanceof Error ? err.message : 'error desconocido'}` })
    }
  }

  async function handleConfirmarAplicar() {
    try {
      const res = await aplicarRegla.mutateAsync()
      setMensaje({ ok: true, texto: `Se aplicó la regla a ${res.aplicados} registros.` })
    } catch (err) {
      setMensaje({ ok: false, texto: `Error al aplicar la regla: ${err instanceof Error ? err.message : 'error desconocido'}` })
    } finally {
      setConfirmandoAplicar(false)
    }
  }

  async function handleConfirmarDeshacer(lote: string) {
    try {
      const res = await deshacerLote.mutateAsync(lote)
      setMensaje({ ok: true, texto: `Se deshicieron ${res.deshechas} registros de ese lote.` })
    } catch (err) {
      setMensaje({ ok: false, texto: `Error al deshacer: ${err instanceof Error ? err.message : 'error desconocido'}` })
    } finally {
      setLoteConfirmandoDeshacer(null)
    }
  }

  const campoCompleto = `${d.modelo_destino}.${d.campo_destino}`
  const volverQs = new URLSearchParams({ campo: campoCompleto })
  if (fuenteId) volverQs.set('fuente', fuenteId)
  if (cargaId) volverQs.set('carga', cargaId)
  const validacionQs = new URLSearchParams({ codigo })
  if (fuenteId) validacionQs.set('fuente', fuenteId)
  if (cargaId) validacionQs.set('carga', cargaId)

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">{d.nombre}</h1>
        <p className="text-sm text-fg-muted mt-1 font-mono">{campoCompleto}</p>
      </div>

      {mensaje && (
        <div
          className={`rounded-lg px-4 py-3.5 text-sm ${
            mensaje.ok
              ? 'bg-brand-teal-light dark:bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal-bright'
              : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <Card title="Qué hace esta regla">
        <p className="text-sm text-fg-muted">{d.descripcion}</p>
      </Card>

      <Card title="Parámetros de cálculo">
        <div data-tour="regladetalle-parametros" className="flex flex-col gap-3.5">
          {d.parametros_schema.map((p) => (
            <div key={p.clave} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">{p.etiqueta}</label>
              <input
                type={p.tipo === 'time' ? 'time' : 'number'}
                value={parametros[p.clave] ?? ''}
                onChange={(e) => setParametros((prev) => ({ ...prev, [p.clave]: e.target.value }))}
                className={inputClass}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleGuardarParametros}
            disabled={actualizarParametros.isPending}
            className="self-start bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
          >
            {actualizarParametros.isPending ? 'Guardando…' : 'Guardar parámetros'}
          </button>
        </div>
      </Card>

      <Card title="Ejemplo con los parámetros actuales, por caso">
        <div data-tour="regladetalle-ejemplo">
        <p className="text-sm text-fg-muted mb-3">
          Los {d.pendientes} registros pendientes se agrupan según qué condición de la regla les aplica.
        </p>
        {d.casos.length === 0 ? (
          <p className="text-sm text-fg-muted">No hay pendientes.</p>
        ) : (
          d.casos.map((caso) => (
            <div key={caso.clave} className="mt-4 first:mt-0">
              <h3 className="flex items-center gap-2.5 text-sm font-bold text-fg mb-2">
                {caso.etiqueta}
                <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {caso.cantidad}
                </span>
              </h3>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface">
                      <th className="px-3 py-2 text-left font-bold text-fg-muted">Registro</th>
                      <th className="px-3 py-2 text-left font-bold text-fg-muted">Contexto</th>
                      <th className="px-3 py-2 text-left font-bold text-fg-muted">Valor propuesto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caso.ejemplo.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-fg-muted">
                          Sin ejemplos.
                        </td>
                      </tr>
                    ) : (
                      caso.ejemplo.map((e) => (
                        <tr key={e.objeto_id} className="border-t border-border">
                          <td className="px-3 py-2 text-fg">#{e.objeto_id}</td>
                          <td className="px-3 py-2 text-fg-muted">{contextoLegible(e.contexto)}</td>
                          <td className="px-3 py-2 text-fg font-semibold">{e.valor_nuevo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {caso.cantidad > caso.ejemplo.length && (
                <p className="text-xs text-fg-muted mt-1.5">
                  Mostrando {caso.ejemplo.length} de {caso.cantidad} de este caso.
                </p>
              )}
            </div>
          ))
        )}
        </div>
      </Card>

      {d.validacion != null && (
        <Card title="Validación de valores">
          <p className="text-sm text-fg-muted mb-3">
            Explora el rango y la distribución de los valores ya asignados en <code>{d.campo_destino}</code>, con
            gráficas para detectar datos mal asignados.
          </p>
          <Link
            to={`/etl/reglas/validacion?${validacionQs.toString()}`}
            className="inline-block bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors"
          >
            📊 Ver validación de rangos →
          </Link>
        </Card>
      )}

      <Card title="Aplicar">
        <div data-tour="regladetalle-aplicar">
        <span className="inline-block bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded-full px-2.5 py-1 text-xs font-bold mb-3">
          {d.pendientes} pendientes en toda la base de datos
        </span>
        {d.pendientes > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setConfirmandoAplicar(true)}
              className="block bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
            >
              Aplicar a los {d.pendientes} pendientes
            </button>
          </div>
        )}
        </div>
      </Card>

      <Card title="Historial de aplicaciones">
        <div data-tour="regladetalle-historial">
        {d.historial.length === 0 ? (
          <p className="text-sm text-fg-muted">Todavía no se ha aplicado esta regla.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-surface">
                  <th className="px-3 py-2 text-left font-bold text-fg-muted">Fecha</th>
                  <th className="px-3 py-2 text-left font-bold text-fg-muted">Registros</th>
                  <th className="px-3 py-2 text-left font-bold text-fg-muted">Estado</th>
                  <th className="px-3 py-2 text-left font-bold text-fg-muted" />
                </tr>
              </thead>
              <tbody>
                {d.historial.map((h) => (
                  <tr key={h.lote} className="border-t border-border">
                    <td className="px-3 py-2 text-fg">{new Date(h.fecha).toLocaleString('es-CO')}</td>
                    <td className="px-3 py-2 text-fg">{h.cantidad}</td>
                    <td className="px-3 py-2 text-fg">
                      {h.deshecho
                        ? `Deshecho${h.deshecha_en ? ` (${new Date(h.deshecha_en).toLocaleString('es-CO')})` : ''}`
                        : 'Aplicado'}
                    </td>
                    <td className="px-3 py-2">
                      {!h.deshecho && (
                        <button
                          type="button"
                          onClick={() => setLoteConfirmandoDeshacer(h.lote)}
                          className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                        >
                          ↩ Deshacer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </Card>

      <Link
        to={`/etl/reglas/campo?${volverQs.toString()}`}
        className="self-start bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
      >
        ← Volver a las reglas del atributo
      </Link>

      <ConfirmModal
        open={confirmandoAplicar}
        title="Aplicar regla"
        description={`¿Confirmas aplicar esta regla a los ${d.pendientes} registros pendientes? Esta acción escribe directamente en la base de datos.`}
        confirmLabel={`Sí, aplicar a ${d.pendientes}`}
        danger
        loading={aplicarRegla.isPending}
        onConfirm={handleConfirmarAplicar}
        onCancel={() => setConfirmandoAplicar(false)}
      />

      <ConfirmModal
        open={loteConfirmandoDeshacer != null}
        title="Deshacer lote"
        description="¿Confirmas deshacer los cambios aplicados en este lote?"
        confirmLabel="Sí, deshacer"
        danger
        loading={deshacerLote.isPending}
        onConfirm={() => loteConfirmandoDeshacer && handleConfirmarDeshacer(loteConfirmandoDeshacer)}
        onCancel={() => setLoteConfirmandoDeshacer(null)}
      />
    </div>
  )
}
