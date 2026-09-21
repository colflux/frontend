import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'

export function useBiomasaProduccion(proyecto?: number, sitio?: number) {
  return useQuery({
    queryKey: ['biomasa-produccion', proyecto, sitio],
    queryFn: () => reportesService.getBiomasaProduccion({ proyecto, sitio }),
    staleTime: 5 * 60 * 1000,
  })
}
