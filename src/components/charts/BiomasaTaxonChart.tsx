import { useState } from 'react'
import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useBiomasaPorTaxon } from '@/hooks/useBiomasaPorTaxon'
import { useThemeStore } from '@/store/useThemeStore'
import type { DimensionBiomasa } from '@/types'

const DIMENSIONES: { valor: DimensionBiomasa; etiqueta: string }[] = [
  { valor: 'familia', etiqueta: 'Familia' },
  { valor: 'genero', etiqueta: 'Género' },
  { valor: 'especie', etiqueta: 'Especie' },
]

export function BiomasaTaxonChart() {
  const [dimension, setDimension] = useState<DimensionBiomasa>('familia')
  const { data, isLoading } = useBiomasaPorTaxon(dimension)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  // Conteo de individuos como proxy de "acumulación de biomasa" por taxón:
  // el carbono/producción de biomasa vive a nivel de parcela (MuestraBiomasa),
  // no por individuo, así que no hay un total de carbono exacto por especie
  // con el esquema actual — a validar con el equipo.
  const chartData = [...(data?.resultados ?? [])]
    .sort((a, b) => b.total_individuos - a.total_individuos)
    .slice(0, 12)

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
        {DIMENSIONES.map((d) => (
          <button
            key={d.valor}
            onClick={() => setDimension(d.valor)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              d.valor === dimension
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-fg-muted hover:text-fg border border-border'
            }`}
          >
            {d.etiqueta}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 20, right: 4, left: -24, bottom: 40 }}>
          <XAxis
            dataKey="nombre"
            tick={{ fill: tickColor, fontSize: 9 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: tickColor, fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
              borderRadius: 6,
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            formatter={(v) => [`${v} individuos`, 'Total']}
          />
          <Bar dataKey="total_individuos" fill="#739E5B" radius={[3, 3, 0, 0]}>
            <LabelList dataKey="total_individuos" position="top" style={{ fontSize: 10, fill: tickColor }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
