import { Link } from 'react-router-dom'
import { CargarDropdown } from '@/components/admin/fuentes/CargarDropdown'
import type { FuenteDatos } from '@/types'

interface Props {
  info: string
  hayFiltrosExtra: boolean
  onLimpiarFiltros: () => void
  proyectoActualId: number | null
  proyectoNombre: string | null
  fuentes: FuenteDatos[]
  fuentesLoading: boolean
  fuenteActualId: number | null
  onDescargar: () => void
  descargando: boolean
  volverHref: string
  volverLabel: string
}

export function DatosToolbar({
  info,
  hayFiltrosExtra,
  onLimpiarFiltros,
  proyectoActualId,
  proyectoNombre,
  fuentes,
  fuentesLoading,
  fuenteActualId,
  onDescargar,
  descargando,
  volverHref,
  volverLabel,
}: Props) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 py-4 border-b border-border">
      <div className="text-sm text-fg-muted">{info}</div>
      <div className="flex items-center gap-2.5 flex-wrap">
        {hayFiltrosExtra && (
          <button
            type="button"
            data-tour="etl-limpiar"
            onClick={onLimpiarFiltros}
            className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
          >
            ✕ Limpiar filtros
          </button>
        )}
        <div data-tour="etl-cargar-dropdown">
          <CargarDropdown
            proyectoActualId={proyectoActualId}
            proyectoNombre={proyectoNombre}
            fuentes={fuentes}
            isLoading={fuentesLoading}
            fuenteActualId={fuenteActualId}
          />
        </div>
        <button
          type="button"
          data-tour="etl-descargar"
          onClick={onDescargar}
          disabled={descargando}
          className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors disabled:opacity-60"
        >
          {descargando ? 'Descargando…' : '⬇ Descargar Excel'}
        </button>
        <Link
          to={volverHref}
          className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
        >
          {volverLabel}
        </Link>
      </div>
    </div>
  )
}
