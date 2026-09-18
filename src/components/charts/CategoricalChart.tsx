import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts'
import { useResumenCategorico } from '@/hooks/useResumenCategorico'
import { useResumenGeo } from '@/hooks/useResumenGeo'
import { useThemeStore } from '@/store/useThemeStore'
import { PIE_COLORS } from '@/utils/formatters'
import type { DimensionCategorica, ResumenCategoricoFilters } from '@/types'

interface ItemNormalizado {
  id: number | string
  nombre: string
  valor: number
}

interface CategoricalChartProps {
  /** Dimensión a agrupar. "region" usa /api/geo/resumen/ (ya expone región
   * agregada) en vez de /api/geo/resumen-categorico/, para no duplicar esa
   * agregación en el backend. */
  dimension: DimensionCategorica | 'region'
  tipo: 'torta' | 'barras'
  /** Métrica a graficar: conteo de muestras (default) o promedio del valor medido. */
  metrica?: 'total_muestras' | 'promedio'
  filters?: ResumenCategoricoFilters
  onSelect?: (id: number | string) => void
  selectedId?: number | string | null
  alturaPx?: number
}

export function CategoricalChart({
  dimension,
  tipo,
  metrica = 'total_muestras',
  filters = {},
  onSelect,
  selectedId,
  alturaPx = 220,
}: CategoricalChartProps) {
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'
  const selectedFill = isDark ? '#ffffff' : '#0f172a'

  const esRegion = dimension === 'region'
  const categorico = useResumenCategorico(
    esRegion ? 'proyecto' : dimension,
    filters,
    !esRegion
  )
  const geo = useResumenGeo('region', filters, esRegion)

  const isLoading = esRegion ? geo.isLoading : categorico.isLoading

  const data: ItemNormalizado[] = esRegion
    ? (geo.data?.features ?? []).map((f) => ({
        id: f.properties.id,
        nombre: f.properties.nombre,
        valor: (metrica === 'promedio' ? f.properties.promedio : f.properties.total_muestras) ?? 0,
      }))
    : (categorico.data?.resultados ?? []).map((r) => ({
        id: r.id,
        nombre: r.nombre,
        valor: (metrica === 'promedio' ? r.promedio : r.total_muestras) ?? 0,
      }))

  const chartData = [...data].sort((a, b) => b.valor - a.valor)

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center text-fg-subtle text-sm"
        style={{ height: alturaPx }}
      >
        Cargando…
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div
        className="flex items-center justify-center text-fg-subtle text-sm"
        style={{ height: alturaPx }}
      >
        Sin datos
      </div>
    )
  }

  const tooltipStyle = {
    contentStyle: {
      background: isDark ? '#1e293b' : '#ffffff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
      borderRadius: 6,
    },
    labelStyle: { color: isDark ? '#e2e8f0' : '#0f172a' },
  }

  if (tipo === 'torta') {
    const total = chartData.reduce((sum, d) => sum + d.valor, 0)
    return (
      <div className="relative">
        <ResponsiveContainer width="100%" height={alturaPx}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="valor"
              nameKey="nombre"
              innerRadius={50}
              outerRadius={80}
              onClick={(d) => onSelect?.((d as unknown as ItemNormalizado).id)}
              style={{ cursor: onSelect ? 'pointer' : undefined }}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={entry.id}
                  fill={entry.id === selectedId ? selectedFill : PIE_COLORS[i % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11, color: tickColor }} />
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <DonutCenterOverlay total={total} isDark={isDark} paddingBottomPx={28} />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={alturaPx}>
      <BarChart data={chartData} margin={{ top: 20, right: 4, left: -24, bottom: 0 }}>
        <XAxis dataKey="nombre" tick={{ fill: tickColor, fontSize: 10 }} />
        <YAxis tick={{ fill: tickColor, fontSize: 10 }} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        <Bar
          dataKey="valor"
          radius={[3, 3, 0, 0]}
          style={{ cursor: onSelect ? 'pointer' : undefined }}
          onClick={(d) => onSelect?.((d as unknown as ItemNormalizado).id)}
        >
          {chartData.map((entry, i) => (
            <Cell
              key={entry.id}
              fill={entry.id === selectedId ? selectedFill : PIE_COLORS[i % PIE_COLORS.length]}
              opacity={entry.id === selectedId ? 1 : 0.85}
            />
          ))}
          <LabelList
            dataKey="valor"
            position="top"
            style={{ fontSize: 10, fill: tickColor }}
            formatter={(v: unknown) => Number(v ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Total al centro de una gráfica de torta/dona (patrón "1.248 Registros"),
 * superpuesto en HTML sobre el SVG -más confiable entre versiones de
 * recharts que el <Label position="center"> nativo, que depende de
 * contexto interno no documentado para inyectar cx/cy.
 */
export function DonutCenterOverlay({
  total,
  subtitulo = 'Registros',
  isDark,
  paddingBottomPx = 0,
}: {
  total: number
  subtitulo?: string
  isDark: boolean
  /** Compensa el espacio que ocupa una <Legend> debajo de la dona, si aplica. */
  paddingBottomPx?: number
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      style={{ paddingBottom: paddingBottomPx }}
    >
      <span className="text-lg font-bold" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
        {total.toLocaleString('es-CO', { maximumFractionDigits: 1 })}
      </span>
      <span className="text-[10px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
        {subtitulo}
      </span>
    </div>
  )
}
