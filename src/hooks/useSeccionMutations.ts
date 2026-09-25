import { useMutation } from '@tanstack/react-query'
import { etlService } from '@/services/etl.service'
import { useAuthStore } from '@/store/useAuthStore'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { construirMapeos } from '@/utils/etlMapeo'
import type { ImportarSeccionResponse, ValidacionSeccionError } from '@/types'

function esError<T extends { ok: boolean }>(data: T | ValidacionSeccionError): data is ValidacionSeccionError {
  return data.ok === false
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Guarda el mapeo (parcial) y pide la previsualización de la sección — el
// llamador decide si mostrar el modal de confirmación o los errores.
export function usePrevisualizarSeccion() {
  const setUltimosErroresPorColumna = useEtlUploadStore((s) => s.setUltimosErroresPorColumna)
  const token = useAuthStore((s) => s.token)

  return useMutation({
    mutationFn: async (hastaGrupo: number) => {
      const {
        fuenteId,
        cargaId,
        hojaActiva,
        columnas,
        mapeoSeleccion,
        mapeoValores,
        atributosManuales,
        extrasDestino,
        atributosCruzados,
      } = useEtlUploadStore.getState()
      if (fuenteId == null || cargaId == null) throw new Error('Falta la fuente o la carga.')
      const mapeos = construirMapeos(
        columnas,
        mapeoSeleccion,
        mapeoValores,
        atributosManuales,
        extrasDestino,
        atributosCruzados
      )
      await etlService.postMapeo(token ?? '', fuenteId, cargaId, hojaActiva, mapeos, true)
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
  const setProgresoImportacion = useEtlUploadStore((s) => s.setProgresoImportacion)
  const token = useAuthStore((s) => s.token)

  return useMutation({
    mutationFn: async (hastaGrupo: number) => {
      const {
        fuenteId,
        cargaId,
        hojaActiva,
        columnas,
        mapeoSeleccion,
        mapeoValores,
        atributosManuales,
        extrasDestino,
        atributosCruzados,
      } = useEtlUploadStore.getState()
      if (fuenteId == null || cargaId == null) throw new Error('Falta la fuente o la carga.')
      const mapeos = construirMapeos(
        columnas,
        mapeoSeleccion,
        mapeoValores,
        atributosManuales,
        extrasDestino,
        atributosCruzados
      )
      await etlService.postMapeo(token ?? '', fuenteId, cargaId, hojaActiva, mapeos, true)

      setProgresoImportacion({ estado: 'en_progreso', actual: 0, total: 0, mensaje: 'Iniciando…' })
      await etlService.iniciarImportarSeccion(token ?? '', fuenteId, cargaId, hastaGrupo)

      // El guardado corre en un hilo en background del servidor (no hay
      // Celery/worker separado) — se consulta el avance por polling en vez
      // de esperar bloqueado una única respuesta larga.
      for (;;) {
        await sleep(1200)
        const estado = await etlService.estadoImportacion(token ?? '', fuenteId, cargaId)
        setProgresoImportacion({
          estado: estado.estado,
          actual: estado.actual,
          total: estado.total,
          mensaje: estado.mensaje,
        })
        if (estado.estado === 'completado') {
          return estado.resultado as ImportarSeccionResponse | ValidacionSeccionError
        }
        if (estado.estado === 'error') {
          throw new Error((estado.resultado as { error?: string } | undefined)?.error || estado.mensaje)
        }
      }
    },
    onSuccess: (data, hastaGrupo) => {
      setProgresoImportacion(null)
      if (esError(data)) setUltimosErroresPorColumna(data.columnas)
      else marcarSeccionGuardada(hastaGrupo)
    },
    onError: () => {
      setProgresoImportacion(null)
    },
  })
}

// Borra en el backend todo el mapeo guardado de una hoja -para cuando se
// mapeó por error con la pestaña de hoja equivocada activa: cambiar de
// pestaña es un cambio de estado local nada más, así que el mapeo viejo
// bajo la hoja anterior nunca se borra solo-.
export function useVaciarMapeoHoja() {
  const vaciarMapeoHojaLocal = useEtlUploadStore((s) => s.vaciarMapeoHojaLocal)
  const token = useAuthStore((s) => s.token)

  return useMutation({
    mutationFn: async (hoja: string) => {
      const { fuenteId, cargaId } = useEtlUploadStore.getState()
      if (fuenteId == null || cargaId == null) throw new Error('Falta la fuente o la carga.')
      return etlService.vaciarMapeoHoja(token ?? '', fuenteId, cargaId, hoja)
    },
    onSuccess: (_data, hoja) => {
      vaciarMapeoHojaLocal(hoja)
    },
  })
}

export { esError }
