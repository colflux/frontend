import type { ReactNode } from 'react'
import { Card } from '@/components/common/Card'

interface Props {
  /** Sin título, la gráfica se dibuja sola (por ejemplo, dentro del panel de un sitio). */
  titulo?: string
  className?: string
  children: ReactNode
}

/**
 * Tarjeta de una gráfica del dashboard. Las gráficas sin datos no se muestran
 * (devuelven null en lugar de un «Sin datos»), así que la tarjeta desaparece
 * con ellas. La clase "grafica" permite además ocultar una sección entera
 * cuando ninguna de sus gráficas tiene datos (ver .seccion-graficas en index.css).
 */
export function TarjetaGrafica({ titulo, className = '', children }: Props) {
  if (!titulo) return <>{children}</>
  return (
    <Card title={titulo} className={`grafica ${className}`}>
      {children}
    </Card>
  )
}

export function CargandoGrafica({ alturaPx = 180 }: { alturaPx?: number }) {
  return (
    <div className="flex items-center justify-center text-fg-subtle text-sm" style={{ height: alturaPx }}>
      Cargando…
    </div>
  )
}

interface Opcion<T extends string> {
  valor: T
  etiqueta: string
}

/** Botones de selección (unidad, mes/año) con el mismo estilo en todas las gráficas. */
export function SelectorGrafica<T extends string>({
  opciones,
  valor,
  onChange,
}: {
  opciones: Opcion<T>[]
  valor: T
  onChange: (valor: T) => void
}) {
  return (
    <div className="flex gap-1 justify-end">
      {opciones.map((o) => (
        <button
          key={o.valor}
          onClick={() => onChange(o.valor)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
            o.valor === valor
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-fg-muted hover:text-fg border border-border'
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  )
}
