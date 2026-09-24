interface Props {
  open: boolean
  titulo: string
  mensaje: string
  textoConfirmar?: string
  textoCancelar?: string
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmModal({
  open,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4" onClick={onCancelar}>
      <div
        className="bg-panel border border-border rounded-xl shadow-2xl max-w-md w-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-3 border-b border-border">
          <h3 className="text-base font-bold text-fg">{titulo}</h3>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-fg-muted">{mensaje}</p>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancelar}
            className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
