import { useQuery } from '@tanstack/react-query'
import { reportesService } from '@/services/reportes.service'
import { useReporteFiltros } from './useGlobalFilters'
import type { Agrupacion } from '@/types'

export function useMomTendencia(agrupar: Agrupacion = 'mes') {
  const filters = useReporteFiltros()
  const params = { agrupar, ...filters }
  return useQuery({
    queryKey: ['mom-tendencia', params],
    queryFn: () => reportesService.getMomTendencia(params),
    staleTime: 5 * 60 * 1000,
  })
}
