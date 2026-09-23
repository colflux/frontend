import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import {
  contarColumnasSinMapear,
  seccionBloqueada,
  seccionesDisponibles,
  seccionesFaltantesPara,
  SIN_MAPEAR_ORDEN,
} from '@/utils/etlMapeo'

export function SeccionNav() {
  const { columnas, mapeoSeleccion, camposDestino, seccionIdx, seccionesGuardadas, setSeccionIdx } =
    useEtlUploadStore()

  if (!camposDestino) return null

  const secciones = seccionesDisponibles(camposDestino.grupos)
  const nSinMapear = contarColumnasSinMapear(columnas, mapeoSeleccion)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2 flex-wrap px-1">
        {secciones.map((s) => {
          const bloqueada = seccionBloqueada(s.orden, camposDestino.grupos, seccionesGuardadas)
          const hecha = seccionesGuardadas.has(s.orden) && s.orden !== seccionIdx
          const activa = s.orden === seccionIdx
          const icono = bloqueada ? '🔒' : hecha ? '✓' : s.icono
          const badge = s.orden === SIN_MAPEAR_ORDEN && nSinMapear ? ` (${nSinMapear} sin mapear)` : ''
          const faltantes = bloqueada ? seccionesFaltantesPara(s.orden, camposDestino.grupos, seccionesGuardadas) : []
          const title = bloqueada
            ? `Bloqueada: primero valida y guarda ${faltantes.join(', ')}.`
            : s.orden === SIN_MAPEAR_ORDEN
              ? 'Vista general: mapea cualquier columna a cualquier modelo, sin restricción de sección.'
              : undefined
          return (
            <button
              key={s.orden}
              type="button"
              disabled={bloqueada}
              title={title}
              onClick={() => setSeccionIdx(s.orden)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activa
                  ? 'bg-brand-teal text-white border-brand-teal'
                  : hecha
                    ? 'bg-brand-teal-light dark:bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal-bright border-brand-teal/40'
                    : bloqueada
                      ? 'bg-surface text-fg-subtle border-border cursor-not-allowed opacity-60'
                      : 'bg-panel text-fg-muted border-border hover:text-fg'
              }`}
            >
              {icono} {s.nombre}
              {badge}
            </button>
          )
        })}
      </div>
      {seccionIdx === SIN_MAPEAR_ORDEN && (
        <p className="text-xs text-fg-muted px-1">
          📋 Vista general — aquí puedes mapear cualquier columna a cualquier modelo, sin importar la sección.
          Para avanzar sección por sección con las validaciones en orden, usa las pestañas de la derecha.
        </p>
      )}
    </div>
  )
}
