import { useState } from 'react'
import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTendenciaInstalacion } from '@/hooks/useTendenciaInstalacion'
import { useThemeStore } from '@/store/useThemeStore'
import type { Agrupacion } from '@/types'

const AGRUPACIONES: { valor: Agrupacion; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'anio', etiqueta: 'Año' },
]

export function InstalacionTrendChart() {
  const [agrupar, setAgrupar] = useState<Agrupacion>('anio')
  const { data, isLoading } = useTendenciaInstalacion(agrupar)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  const chartData = (data?.resultados ?? []).map((r) => ({
    periodo: agrupar === 'anio' ? r.periodo.slice(0, 4) : r.periodo.slice(0, 7),
    total: r.total,
  }))

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center text-fg-subtle text-sm">
        Cargando…
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="h-48 flex items-center justify-center text-fg-subtle text-sm">
        Sin datos
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 justify-end">
        {AGRUPACIONES.map((a) => (
          <button
            key={a.valor}
            onClick={() => setAgrupar(a.valor)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              a.valor === agrupar
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-fg-muted hover:text-fg border border-border'
            }`}
          >
            {a.etiqueta}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 20, right: 4, left: -24, bottom: 0 }}>
          <XAxis dataKey="periodo" tick={{ fill: tickColor, fontSize: 10 }} />
          <YAxis tick={{ fill: tickColor, fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
              borderRadius: 6,
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            formatter={(v) => [`${v} unidades`, 'Instaladas']}
          />
          <Bar dataKey="total" fill="#198A77" radius={[3, 3, 0, 0]}>
            <LabelList dataKey="total" position="top" style={{ fontSize: 10, fill: tickColor }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
