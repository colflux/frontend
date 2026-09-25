import { useMemo } from 'react'
import { useSeries } from '@/hooks/useSeries'
import { EmissionTrendChart } from '@/components/charts/EmissionTrendChart'
import { FlujoClimaChart } from '@/components/charts/FlujoClimaChart'

interface Props {
  sitioId: number
  proyectoId: number | null
}

/** Panel de "Gráficas" para la categoría flujos: la tendencia principal
 * (respeta el filtro global de gas/día-noche/analizador) más el cruce de
 * flujo con clima, compacto para no agrandar la sección. */
export function FlujosGraficasPanel({ sitioId, proyectoId }: Props) {
  const { data: series, isLoading } = useSeries({
    sitio: sitioId,
    gas: undefined,
    analizador: undefined,
    condicion_luz: undefined,
  })
  const resultados = useMemo(() => series?.resultados ?? [], [series])

  return (
    <div className="flex flex-col gap-3">
      <EmissionTrendChart sitioId={sitioId} />

      <div className="border-t border-border pt-2">
        <p className="text-xs text-fg-muted font-semibold uppercase tracking-wider mb-1">Flujo vs. clima</p>
        <FlujoClimaChart resultados={resultados} isLoading={isLoading} sitioId={sitioId} proyectoId={proyectoId} />
      </div>
    </div>
  )
}
