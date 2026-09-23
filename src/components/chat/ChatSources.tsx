import { useState } from 'react'
import { BotonDescarga } from '@/components/chat/BotonDescarga'
import { esArchivoSubido, nombreArchivo } from '@/utils/archivosSubidos'
import type { ChatSource } from '@/types'

interface Props {
  sources: ChatSource[]
}

export function ChatSources({ sources }: Props) {
  const [open, setOpen] = useState(false)

  if (!sources.length) return null

  return (
    <div className="mt-1.5 text-xs w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-fg-muted hover:text-fg font-medium flex items-center gap-1"
      >
        <span aria-hidden>{open ? '▼' : '▶'}</span>
        {sources.length} fuente{sources.length === 1 ? '' : 's'}
      </button>

      {open && (
        <ul className="mt-2 flex flex-col gap-2">
          {sources.map((s, i) => (
            <li key={`${s.source}-${i}`} className="bg-surface border border-border rounded-md p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-fg truncate">{nombreArchivo(s.source)}</span>
                <span className="shrink-0 text-fg-subtle">{(s.score * 100).toFixed(0)}%</span>
              </div>
              <p className="text-fg-muted mt-1">{s.content}</p>
              {esArchivoSubido(s.source) && (
                <div className="mt-1">
                  <BotonDescarga archivo={s.source} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
