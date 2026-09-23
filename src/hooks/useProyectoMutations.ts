import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { proyectosService } from '@/services/proyectos.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { ProyectoPayload } from '@/types'

export function useProyectos() {
  return useQuery({
    queryKey: ['proyectos'],
    queryFn: () => proyectosService.listProyectos(),
  })
}

export function useCrearProyecto() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (payload: ProyectoPayload) => proyectosService.crearProyecto(token ?? '', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuentes-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
    },
  })
}

export function useActualizarProyecto() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProyectoPayload }) =>
      proyectosService.actualizarProyecto(token ?? '', id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuentes-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
    },
  })
}

export function useEliminarProyecto() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (id: number) => proyectosService.eliminarProyecto(token ?? '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuentes-dropdown'] })
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
    },
  })
}
