import { useQuery } from '@tanstack/react-query'
import { greenhouseService } from '@/services/greenhouse.service'
import { useAppStore } from '@/store/useAppStore'

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => greenhouseService.getRegions(),
    staleTime: Infinity,
  })
}

export function useEmissions() {
  const filters = useAppStore((s) => s.filters)
  return useQuery({
    queryKey: ['emissions', filters],
    queryFn: () => greenhouseService.getEmissions(filters),
  })
}

export function useTrend() {
  const regionId = useAppStore((s) => s.filters.regionId)
  return useQuery({
    queryKey: ['trend', regionId],
    queryFn: () => greenhouseService.getTrend(regionId ?? undefined),
  })
}
