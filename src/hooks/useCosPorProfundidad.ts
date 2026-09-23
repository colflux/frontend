import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'
import { useReporteFiltros } from './useGlobalFilters'
import type { ReporteGeoFilters } from '@/types'

export function useCosPorProfundidad(overrides: ReporteGeoFilters = {}) {
  const filters = { ...useReporteFiltros(), ...overrides }
  return useQuery({
    queryKey: ['cos-por-profundidad', filters],
    queryFn: () => reportesService.getCosPorProfundidad(filters),
    staleTime: 5 * 60 * 1000,
  })
}
