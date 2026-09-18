import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'
import type { Agrupacion } from '@/types'

export function useMomTendencia(agrupar: Agrupacion = 'mes', proyecto?: number) {
  return useQuery({
    queryKey: ['mom-tendencia', agrupar, proyecto],
    queryFn: () => reportesService.getMomTendencia({ agrupar, proyecto }),
    staleTime: 5 * 60 * 1000,
  })
}
