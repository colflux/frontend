import { useMutation } from '@tanstack/react-query'
import { etlService } from '@/services/etl.service'
import { useAuthStore } from '@/store/useAuthStore'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { construirMapeos } from '@/utils/etlMapeo'
import type { ValidacionSeccionError } from '@/types'

function esError<T extends { ok: boolean }>(data: T | ValidacionSeccionError): data is ValidacionSeccionError {
  return data.ok === false
}

// Guarda el mapeo (parcial) y pide la previsualización de la sección — el
// llamador decide si mostrar el modal de confirmación o los errores.
export function usePrevisualizarSeccion() {
  const setUltimosErroresPorColumna = useEtlUploadStore((s) => s.setUltimosErroresPorColumna)
  const token = useAuthStore((s) => s.token)

  return useMutation({
    mutationFn: async (hastaGrupo: number) => {
      const { fuenteId, cargaId, columnas, mapeoSeleccion, mapeoValores, atributosManuales, extrasDestino } =
        useEtlUploadStore.getState()
      if (fuenteId == null || cargaId == null) throw new Error('Falta la fuente o la carga.')
      const mapeos = construirMapeos(columnas, mapeoSeleccion, mapeoValores, atributosManuales, extrasDestino)
      await etlService.postMapeo(token ?? '', fuenteId, cargaId, mapeos, true)
      const data = await etlService.previsualizarSeccion(token ?? '', fuenteId, cargaId, hastaGrupo)
      return data
    },
    onSuccess: (data) => {
      if (esError(data)) setUltimosErroresPorColumna(data.columnas)
    },
  })
}

export function useImportarSeccion() {
  const marcarSeccionGuardada = useEtlUploadStore((s) => s.marcarSeccionGuardada)
  const setUltimosErroresPorColumna = useEtlUploadStore((s) => s.setUltimosErroresPorColumna)
  const token = useAuthStore((s) => s.token)

  return useMutation({
    mutationFn: (hastaGrupo: number) => {
      const { fuenteId, cargaId } = useEtlUploadStore.getState()
      if (fuenteId == null || cargaId == null) throw new Error('Falta la fuente o la carga.')
      return etlService.importarSeccion(token ?? '', fuenteId, cargaId, hastaGrupo)
    },
    onSuccess: (data, hastaGrupo) => {
      if (esError(data)) setUltimosErroresPorColumna(data.columnas)
      else marcarSeccionGuardada(hastaGrupo)
    },
  })
}

export { esError }
