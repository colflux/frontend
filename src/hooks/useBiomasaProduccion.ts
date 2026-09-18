import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'

export function useBiomasaProduccion(proyecto?: number) {
  return useQuery({
    queryKey: ['biomasa-produccion', proyecto],
    queryFn: () => reportesService.getBiomasaProduccion({ proyecto }),
    staleTime: 5 * 60 * 1000,
  })
}
