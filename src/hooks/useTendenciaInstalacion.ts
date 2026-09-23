import { useQuery } from '@tanstack/react-query'
import { geoService } from '@/services/geo.service'
import { useReporteFiltros } from './useGlobalFilters'
import type { Agrupacion } from '@/types'

export function useTendenciaInstalacion(agrupar: Agrupacion = 'mes') {
  // Sin fecha: el propio eje x de esta gráfica ya es fecha_instalacion, y el
  // backend de tendencia-instalacion no acepta desde/hasta.
  const filters = useReporteFiltros(false)
  const params = { agrupar, ...filters }
  return useQuery({
    queryKey: ['tendencia-instalacion', params],
    queryFn: () => geoService.getTendenciaInstalacion(params),
    staleTime: 5 * 60 * 1000,
  })
}
