import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'
import { useReporteFiltros } from './useGlobalFilters'
import type { DimensionBiomasa } from '@/types'

export function useBiomasaPorTaxon(dimension: DimensionBiomasa = 'familia') {
  const filters = useReporteFiltros()
  return useQuery({
    queryKey: ['biomasa-por-taxon', dimension, filters],
    queryFn: () => reportesService.getBiomasaPorTaxon(dimension, filters),
    staleTime: 5 * 60 * 1000,
  })
}
