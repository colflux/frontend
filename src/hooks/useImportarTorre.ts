import { useMutation, useQueryClient } from '@tanstack/react-query'
import { etlService } from '@/services/etl.service'
import { useAuthStore } from '@/store/useAuthStore'

export function useImportarTorre() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fuenteId, torreId, archivo }: { fuenteId: number; torreId: number; archivo: File }) =>
      etlService.importarTorre(token ?? '', fuenteId, torreId, archivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuentes-dropdown'] })
    },
  })
}
