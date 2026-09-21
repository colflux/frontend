import { useQuery } from '@tanstack/react-query'
import { statsService } from '@/services/stats.service'

export function useHomeStats() {
  return useQuery({
    queryKey: ['home-stats'],
    queryFn: statsService.getHomeStats,
    staleTime: 5 * 60 * 1000,
  })
}
