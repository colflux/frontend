import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useCosPorProfundidad } from '@/hooks/useCosPorProfundidad'
import { useAppStore } from '@/store/useAppStore'
import { useThemeStore } from '@/store/useThemeStore'

// Marrón oscuro→claro para sugerir profundidad creciente del perfil de suelo.
const PROFUNDIDAD_COLORS = ['#8a5a3c', '#7a4d33', '#6a402a', '#5a3321', '#4a2618', '#3a1a0f']

interface Props {
  sitioId?: number
}

export function CosProfundidadChart({ sitioId }: Props = {}) {
  const { data, isLoading } = useCosPorProfundidad(sitioId != null ? { sitio: sitioId } : {})
  // "Profundidad de muestra" del recuadro de filtros de COS resalta el rango
  // elegido en vez de recargar datos: el backend ya trae todos los rangos
  // en una sola respuesta.
  const profundidadSeleccionada = useAppStore((s) => s.cosProfundidad)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  const chartData = data?.resultados ?? []

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
      {/* Layout vertical: profundidad 0 arriba, como un perfil de suelo. */}
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <XAxis
          type="number"
          tick={{ fill: tickColor, fontSize: 10 }}
          label={{ value: '% carbono', position: 'insideBottom', offset: -2, fill: tickColor, fontSize: 10 }}
        />
        <YAxis
          type="category"
          dataKey="rango_profundidad"
          tick={{ fill: tickColor, fontSize: 10 }}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: isDark ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
            borderRadius: 6,
          }}
          labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
          formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Carbono promedio']}
        />
        <Bar dataKey="carbono_pct_promedio" radius={[0, 3, 3, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={entry.rango_profundidad}
              fill={PROFUNDIDAD_COLORS[i % PROFUNDIDAD_COLORS.length]}
              opacity={
                profundidadSeleccionada == null || entry.rango_profundidad === profundidadSeleccionada ? 1 : 0.3
              }
            />
          ))}
          <LabelList
            dataKey="carbono_pct_promedio"
            position="right"
            style={{ fontSize: 10, fill: tickColor }}
            formatter={(v: unknown) => `${Number(v ?? 0).toFixed(1)}%`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
