import { useQuery } from '@tanstack/react-query'
import { geoService } from '@/services/geo.service'
import type { SitiosFilters } from '@/types'

export function useSitios(filters: SitiosFilters = {}) {
  return useQuery({
    queryKey: ['sitios', filters],
    queryFn: () => geoService.getSitios(filters),
    staleTime: 5 * 60 * 1000,
  })
}
