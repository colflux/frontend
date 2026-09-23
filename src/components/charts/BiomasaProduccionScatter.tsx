import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useBiomasaProduccion } from '@/hooks/useBiomasaProduccion'
import { useThemeStore } from '@/store/useThemeStore'

interface Props {
  sitioId?: number
}

export function BiomasaProduccionScatter({ sitioId }: Props = {}) {
  const { data, isLoading } = useBiomasaProduccion(sitioId != null ? { sitio: sitioId } : {})
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  const chartData = (data?.resultados ?? [])
    .filter((r) => r.prod_biomasa_g != null)
    .map((r) => ({
      fecha: r.fecha,
      prod_biomasa_g: r.prod_biomasa_g,
      sitio_nombre: r.sitio_nombre,
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
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
        <XAxis
          dataKey="fecha"
          name="Fecha"
          tick={{ fill: tickColor, fontSize: 10 }}
        />
        <YAxis
          dataKey="prod_biomasa_g"
          name="Producción de biomasa (g)"
          tick={{ fill: tickColor, fontSize: 10 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            background: isDark ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
            borderRadius: 6,
          }}
          labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
          formatter={(v, n) => [n === 'prod_biomasa_g' ? `${v} g` : v, n === 'prod_biomasa_g' ? 'Producción' : n]}
        />
        <Scatter data={chartData} fill="#198A77" opacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
