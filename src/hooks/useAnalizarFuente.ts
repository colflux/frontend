import { useMutation } from '@tanstack/react-query'
import { etlService } from '@/services/etl.service'
import { useAuthStore } from '@/store/useAuthStore'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'

// Analizar el archivo y cargar el catálogo de campos destino son dos
// llamadas separadas en el backend, pero el wizard no puede mostrar el
// Paso 2 hasta tener ambas — se combinan en una sola mutation.
export function useAnalizarFuente() {
  const setAnalisis = useEtlUploadStore((s) => s.setAnalisis)
  const token = useAuthStore((s) => s.token)

  return useMutation({
    mutationFn: async ({ fuenteId, archivo }: { fuenteId: number; archivo?: File }) => {
      const analisis = await etlService.analizarFuente(token ?? '', fuenteId, archivo)
      const camposDestino = await etlService.getCamposDestino(fuenteId)
      return { analisis, camposDestino }
    },
    onSuccess: ({ analisis, camposDestino }) => {
      setAnalisis(
        {
          cargaId: analisis.carga_id,
          columnas: analisis.columnas,
          sheets: analisis.sheets,
          hojaActiva: analisis.hoja_activa,
          totalFilas: analisis.total_filas,
          mapeosPrevios: analisis.mapeos,
        },
        camposDestino
      )
    },
  })
}
