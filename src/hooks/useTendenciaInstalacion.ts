import { useQuery } from '@tanstack/react-query'
import { geoService } from '@/services/geo.service'
import type { Agrupacion } from '@/types'

export function useTendenciaInstalacion(agrupar: Agrupacion = 'mes', proyecto?: number) {
  return useQuery({
    queryKey: ['tendencia-instalacion', agrupar, proyecto],
    queryFn: () => geoService.getTendenciaInstalacion({ agrupar, proyecto }),
    staleTime: 5 * 60 * 1000,
  })
}
