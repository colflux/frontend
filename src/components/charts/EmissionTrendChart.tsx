import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTrend } from '@/hooks/useGreenhouseData'
import { GAS_COLORS } from '@/utils/formatters'

export function EmissionTrendChart() {
  const { data = [], isLoading } = useTrend()

  if (isLoading) {
    return (
      <div className="h-36 flex items-center justify-center text-slate-500 text-sm">
        Cargando tendencia…
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
        <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(v) => [`${v} MtCO₂e`]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        <Line type="monotone" dataKey="CO2" stroke={GAS_COLORS.CO2} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="CH4" stroke={GAS_COLORS.CH4} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="N2O" stroke={GAS_COLORS.N2O} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
