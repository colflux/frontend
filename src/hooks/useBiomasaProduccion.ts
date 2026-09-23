import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'
import { useReporteFiltros } from './useGlobalFilters'
import type { ReporteGeoFilters } from '@/types'

export function useBiomasaProduccion(overrides: ReporteGeoFilters = {}) {
  const filters = { ...useReporteFiltros(), ...overrides }
  return useQuery({
    queryKey: ['biomasa-produccion', filters],
    queryFn: () => reportesService.getBiomasaProduccion(filters),
    staleTime: 5 * 60 * 1000,
  })
}
