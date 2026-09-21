import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { useReglasAutollenadoLista } from '@/hooks/useReglasAutollenadoLista'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'

function qsConFuenteCarga(base: Record<string, string>, fuenteId: string | null, cargaId: string | null) {
  const qs = new URLSearchParams(base)
  if (fuenteId) qs.set('fuente', fuenteId)
  if (cargaId) qs.set('carga', cargaId)
  return qs.toString()
}

export function EtlReglasCampo() {
  const [searchParams] = useSearchParams()
  const campo = searchParams.get('campo')
  const fuenteId = searchParams.get('fuente')
  const cargaId = searchParams.get('carga')

  const { data: reglas, isLoading, isError, error } = useReglasAutollenadoLista()
  const reglasDelCampo = reglas?.filter((r) => `${r.modelo_destino}.${r.campo_destino}` === campo) ?? []

  const volverHref = fuenteId && cargaId ? `/etl/datos?${qsConFuenteCarga({}, fuenteId, cargaId)}` : null

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'etl-reglas-campo',
    steps: [
      {
        element: '[data-tour="reglascampo-tarjetas"]',
        popover: {
          title: 'Reglas disponibles',
          description: 'Autollenado y validación de rangos para este atributo. Entra a cada tarjeta para verla en detalle.',
        },
      },
    ],
  })

  return (
    <div className="flex-1 p-6 flex flex-col gap-1 max-w-5xl mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">{campo || 'Reglas del atributo'}</h1>
        <p className="text-sm text-fg-muted mt-1">
          Reglas de autollenado y validación disponibles para este atributo.
        </p>
      </div>

      {!campo ? (
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          Falta indicar el atributo (parámetro ?campo= en la URL, formato Modelo.campo).
        </div>
      ) : isLoading ? (
        <div className="text-center text-fg-muted text-sm py-10">Cargando reglas…</div>
      ) : isError ? (
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          Error al cargar las reglas: {error instanceof Error ? error.message : 'error desconocido'}
        </div>
      ) : reglasDelCampo.length === 0 ? (
        <div className="text-center text-fg-muted text-sm py-10">
          No hay reglas configuradas para este atributo.
        </div>
      ) : (
        <div data-tour="reglascampo-tarjetas" className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
          {reglasDelCampo.flatMap((r) => {
            const tarjetas = [
              <Link
                key={`detalle-${r.codigo}`}
                to={`/etl/reglas/detalle?${qsConFuenteCarga({ codigo: r.codigo }, fuenteId, cargaId)}`}
                className="block"
              >
                <Card className="h-full hover:border-brand-teal transition-colors">
                  <p className="text-xl mb-1.5" aria-hidden>
                    🛠️
                  </p>
                  <h3 className="text-sm font-bold text-fg mb-1.5">{r.nombre}</h3>
                  <p className="text-xs text-fg-muted mb-2.5">{r.descripcion}</p>
                  {r.pendientes > 0 && (
                    <span className="inline-block bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded-full px-2.5 py-1 text-xs font-bold">
                      {r.pendientes} pendientes
                    </span>
                  )}
                  <p className="text-xs font-bold text-brand-teal dark:text-brand-teal-bright mt-2.5">
                    Ver regla de autollenado →
                  </p>
                </Card>
              </Link>,
            ]
            if (r.tiene_validacion) {
              tarjetas.push(
                <Link
                  key={`validacion-${r.codigo}`}
                  to={`/etl/reglas/validacion?${qsConFuenteCarga({ codigo: r.codigo }, fuenteId, cargaId)}`}
                  className="block"
                >
                  <Card className="h-full hover:border-brand-teal transition-colors">
                    <p className="text-xl mb-1.5" aria-hidden>
                      📊
                    </p>
                    <h3 className="text-sm font-bold text-fg mb-1.5">Validación de rangos</h3>
                    <p className="text-xs text-fg-muted mb-2.5">
                      Explora el rango y la distribución de los valores ya asignados en{' '}
                      <code>{campo}</code>, con gráficas para detectar datos mal asignados.
                    </p>
                    <p className="text-xs font-bold text-brand-teal dark:text-brand-teal-bright mt-2.5">
                      Ver validación de rangos →
                    </p>
                  </Card>
                </Link>
              )
            }
            return tarjetas
          })}
        </div>
      )}

      {volverHref && (
        <Link
          to={volverHref}
          className="self-start bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
        >
          ← Volver a los datos de la carga
        </Link>
      )}
    </div>
  )
}
