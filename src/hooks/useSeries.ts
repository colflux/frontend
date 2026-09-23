import { useQuery } from '@tanstack/react-query'
import { geoService } from '@/services/geo.service'
import { useAppStore } from '@/store/useAppStore'
import { useReporteFiltros } from './useGlobalFilters'
import type { SeriesFilters } from '@/types'

export function useSeries(overrides: SeriesFilters = {}) {
  const { year, gas } = useAppStore((s) => s.filters)
  const flujosAnalizadorId = useAppStore((s) => s.flujosAnalizadorId)
  const flujosCondicionLuzId = useAppStore((s) => s.flujosCondicionLuzId)
  // Geográficos/proyecto compartidos con biomasa/cos/mom -"anio" ya cubre el
  // filtro de fecha aquí, así que se pide sin desde/hasta-.
  const geoFiltros = useReporteFiltros(false)

  const filters: SeriesFilters = {
    ...geoFiltros,
    anio: year ?? undefined,
    gas,
    analizador: flujosAnalizadorId ?? undefined,
    condicion_luz: flujosCondicionLuzId != null ? String(flujosCondicionLuzId) : undefined,
    ...overrides,
  }

  return useQuery({
    queryKey: ['series', filters],
    queryFn: () => geoService.getSeries(filters),
  })
}
