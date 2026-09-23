import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fuentesService } from '@/services/fuentes.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { FuenteDatosPayload } from '@/types'

export function useCrearFuente() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (payload: FuenteDatosPayload) => fuentesService.createFuente(token ?? '', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuentes-dropdown'] })
    },
  })
}

export function useActualizarFuente() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FuenteDatosPayload }) =>
      fuentesService.updateFuente(token ?? '', id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuentes-dropdown'] })
    },
  })
}

export function useSubirArchivoFuente() {
  return useMutation({
    mutationFn: ({ fuenteId, archivo }: { fuenteId: number; archivo: File }) =>
      fuentesService.uploadArchivoFuente(fuenteId, archivo),
  })
}

export function useEliminarFuente() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (id: number) => fuentesService.eliminarFuente(token ?? '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuentes-dropdown'] })
    },
  })
}
