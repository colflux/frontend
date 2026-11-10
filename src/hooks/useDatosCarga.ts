import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { datosService } from '@/services/datos.service'
import type { DatosProyectoFilters } from '@/types'

export function useDatosCarga(
  fuenteId: number | null,
  cargaId: number | null,
  filters: DatosProyectoFilters
) {
  return useQuery({
    queryKey: ['datos-carga', fuenteId, cargaId, filters],
    queryFn: () => datosService.getDatosCarga(fuenteId as number, cargaId as number, filters),
    enabled: fuenteId != null && cargaId != null,
    placeholderData: keepPreviousData,
  })
}
