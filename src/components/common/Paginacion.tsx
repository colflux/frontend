interface Props {
  offset: number
  limite: number
  total: number
  filasCount: number
  onAnterior: () => void
  onSiguiente: () => void
}

export function Paginacion({ offset, limite, total, filasCount, onAnterior, onSiguiente }: Props) {
  return (
    <div data-tour="etl-paginacion" className="flex items-center justify-center gap-4 py-4 text-sm text-fg-muted">
      <button
        type="button"
        onClick={onAnterior}
        disabled={offset === 0}
        className="bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold px-3 py-2 rounded-md transition-colors"
      >
        ← Anterior
      </button>
      <span>
        {total ? offset + 1 : 0}–{Math.min(offset + filasCount, total)} de {total}
      </span>
      <button
        type="button"
        onClick={onSiguiente}
        disabled={offset + limite >= total}
        className="bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold px-3 py-2 rounded-md transition-colors"
      >
        Siguiente →
      </button>
    </div>
  )
}
