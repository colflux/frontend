import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'
import type { DimensionBiomasa } from '@/types'

export function useBiomasaPorTaxon(dimension: DimensionBiomasa = 'familia') {
  return useQuery({
    queryKey: ['biomasa-por-taxon', dimension],
    queryFn: () => reportesService.getBiomasaPorTaxon(dimension),
    staleTime: 5 * 60 * 1000,
  })
}
