import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'

export function useCosPorProfundidad(proyecto?: number, sitio?: number) {
  return useQuery({
    queryKey: ['cos-por-profundidad', proyecto, sitio],
    queryFn: () => reportesService.getCosPorProfundidad({ proyecto, sitio }),
    staleTime: 5 * 60 * 1000,
  })
}
