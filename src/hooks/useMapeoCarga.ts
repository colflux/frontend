import { useQuery } from '@tanstack/react-query'
import { mapeoService } from '@/services/mapeo.service'
import { useAuthStore } from '@/store/useAuthStore'

export function useMapeoCarga(fuenteId: number | null, cargaId: number | null) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['mapeo-carga', fuenteId, cargaId],
    queryFn: () => mapeoService.getMapeoCarga(token as string, fuenteId as number, cargaId as number),
    enabled: fuenteId != null && cargaId != null && !!token,
  })
}
