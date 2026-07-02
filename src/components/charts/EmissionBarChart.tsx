import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useRegions, useEmissions } from '@/hooks/useGreenhouseData'
import { useAppStore } from '@/store/useAppStore'
import { GAS_COLORS } from '@/utils/formatters'

export function EmissionBarChart() {
  const { data: regions = [] } = useRegions()
  const { data: emissions = [], isLoading } = useEmissions()
  const { filters, setRegion } = useAppStore()

  const chartData = regions
    .map((r) => ({
      id: r.id,
      name: r.name.split(' ')[0],
      total: parseFloat(
        emissions.filter((e) => e.regionId === r.id).reduce((a, e) => a + e.value, 0).toFixed(1)
      ),
    }))
    .sort((a, b) => b.total - a.total)

  const barColor = GAS_COLORS[filters.gas] ?? GAS_COLORS.CO2

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        Cargando…
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(v) => [`${v} MtCO₂e`, 'Emisión']}
        />
        <Bar
          dataKey="total"
          radius={[3, 3, 0, 0]}
          style={{ cursor: 'pointer' }}
          onClick={(d: { id?: string }) => {
            if (d.id) setRegion(d.id === filters.regionId ? null : d.id)
          }}
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.id}
              fill={entry.id === filters.regionId ? '#ffffff' : barColor}
              opacity={entry.id === filters.regionId ? 1 : 0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
