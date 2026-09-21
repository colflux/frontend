import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Collapsible({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-border pt-4 flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between text-xs text-fg-muted font-semibold uppercase tracking-wider"
      >
        {title}
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="flex flex-col gap-4">{children}</div>}
    </div>
  )
}
