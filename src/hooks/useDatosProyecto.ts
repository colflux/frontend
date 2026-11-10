import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { datosService } from '@/services/datos.service'
import type { DatosProyectoFilters } from '@/types'

export function useDatosProyecto(proyectoId: number | null, filters: DatosProyectoFilters) {
  return useQuery({
    queryKey: ['datos-proyecto', proyectoId, filters],
    queryFn: () => datosService.getDatosProyecto(proyectoId as number, filters),
    enabled: proyectoId != null,
    placeholderData: keepPreviousData,
  })
}
