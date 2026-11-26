import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFuenteDrawerStore } from '@/store/useFuenteDrawerStore'
import type { FuenteDatos } from '@/types'

interface Props {
  proyectoActualId: number | null
  proyectoNombre: string | null
  fuentes: FuenteDatos[]
  isLoading?: boolean
  fuenteActualId?: number | null
}

export function CargarDropdown({
  proyectoActualId,
  proyectoNombre,
  fuentes,
  isLoading = false,
  fuenteActualId = null,
}: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const openDrawer = useFuenteDrawerStore((s) => s.openDrawer)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('click', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const fuentesProyecto = fuentes.filter((f) => (f.proyecto?.id ?? null) === proyectoActualId)

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
      >
        ⬆ Cargar ▾
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-panel border border-border rounded-lg shadow-lg w-72 p-2">
          <div className="text-[11px] font-bold uppercase tracking-wide text-fg-muted px-2 pt-1.5 pb-1">
            {proyectoNombre ? `Fuentes de ${proyectoNombre}` : 'Fuentes de este proyecto'}
          </div>

          {isLoading ? (
            <div className="px-2 py-2.5 text-sm text-fg-muted">Cargando…</div>
          ) : fuentesProyecto.length === 0 ? (
            <div className="px-2 py-2.5 text-sm text-fg-muted">
              Este proyecto todavía no tiene fuentes.
            </div>
          ) : (
            fuentesProyecto.map((f) => {
              const esActual = fuenteActualId != null && f.id === fuenteActualId
              return esActual ? (
                <span
                  key={f.id}
                  className="block w-full text-left rounded-md px-2 py-2 text-sm font-semibold bg-brand-teal/10 text-brand-teal dark:text-brand-teal-bright cursor-default"
                >
                  {f.nombre}
                  <small className="block text-xs font-medium text-fg-muted">Viendo esta fuente</small>
                </span>
              ) : (
                <Link
                  key={f.id}
                  to={`/etl/upload-bronce?fuente=${f.id}`}
                  onClick={() => setOpen(false)}
                  className="block w-full text-left rounded-md px-2 py-2 text-sm text-fg hover:bg-surface"
                >
                  {f.nombre}
                  <small className="block text-xs text-fg-muted">{f.tipo_label || f.tipo}</small>
                </Link>
              )
            })
          )}

          <div className="border-t border-border my-1.5" />

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              openDrawer({ proyectoContextId: proyectoActualId })
            }}
            className="flex items-center gap-1.5 w-full rounded-md px-2 py-2 text-sm font-bold text-brand-teal dark:text-brand-teal-bright hover:bg-brand-teal/10"
          >
            ＋ Agregar nueva fuente
          </button>
        </div>
      )}
    </div>
  )
}
