import { useQuery } from '@tanstack/react-query'
import { geoService } from '@/services/geo.service'
import type { DimensionCategorica, ResumenCategoricoFilters } from '@/types'

export function useResumenCategorico(
  dimension: DimensionCategorica,
  filters: ResumenCategoricoFilters = {},
  enabled = true
) {
  return useQuery({
    queryKey: ['resumen-categorico', dimension, filters],
    queryFn: () => geoService.getResumenCategorico(dimension, filters),
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}
