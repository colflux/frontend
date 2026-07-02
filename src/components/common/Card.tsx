import type { ReactNode } from 'react'

interface Props {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: Props) {
  return (
    <div className={`bg-panel rounded-lg border border-border p-4 ${className}`}>
      {title && (
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
