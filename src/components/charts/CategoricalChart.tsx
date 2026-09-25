import type { ReactNode } from 'react'
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
  ReferenceLine,
} from 'recharts'
import { CargandoGrafica, TarjetaGrafica } from '@/components/charts/TarjetaGrafica'
import { useResumenCategorico } from '@/hooks/useResumenCategorico'
import { useResumenGeo } from '@/hooks/useResumenGeo'
import { useThemeStore } from '@/store/useThemeStore'
import { PIE_COLORS, formatUnidad } from '@/utils/formatters'
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
  /** Título de la tarjeta. Si la gráfica no tiene datos, no se muestra ni la tarjeta. */
  titulo?: string
  className?: string
  /** Unidad de los valores cuando metrica="promedio" (va en el eje y en el tooltip). */
  unidad?: string
  /** Controles sobre la gráfica (p. ej. selector de unidad). */
  controles?: ReactNode
}

// Con más categorías que esto, las etiquetas del eje x se inclinan para que quepan.
const MAX_ETIQUETAS_RECTAS = 4

export function CategoricalChart({
  dimension,
  tipo,
  metrica = 'total_muestras',
  filters = {},
  onSelect,
  selectedId,
  alturaPx = 220,
  titulo,
  className,
  unidad,
  controles,
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
      <TarjetaGrafica titulo={titulo} className={className}>
        <CargandoGrafica alturaPx={alturaPx} />
      </TarjetaGrafica>
    )
  }

  // Sin datos no se muestra la gráfica (ni su tarjeta).
  if (!chartData.length) return null

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
      <TarjetaGrafica titulo={titulo} className={className}>
      {controles}
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
      </TarjetaGrafica>
    )
  }

  const esPromedio = metrica === 'promedio'
  const inclinar = chartData.length > MAX_ETIQUETAS_RECTAS
  const etiquetaUnidad = unidad ? formatUnidad(unidad) : ''
  const formatear = (v: unknown) =>
    Number(v ?? 0).toLocaleString('es-CO', { maximumFractionDigits: esPromedio ? 2 : 0 })

  return (
    <TarjetaGrafica titulo={titulo} className={className}>
    {controles}
    <ResponsiveContainer width="100%" height={alturaPx + (inclinar ? 50 : 0)}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 8, left: esPromedio ? 0 : -24, bottom: inclinar ? 40 : 0 }}
      >
        <XAxis
          dataKey="nombre"
          tick={{ fill: tickColor, fontSize: inclinar ? 9 : 10 }}
          interval={0}
          angle={inclinar ? -35 : 0}
          textAnchor={inclinar ? 'end' : 'middle'}
        />
        <YAxis
          tick={{ fill: tickColor, fontSize: 10 }}
          allowDecimals={esPromedio}
          domain={esPromedio ? dominioPromedio(chartData.map((d) => d.valor)) : [0, 'auto']}
          tickFormatter={formatear}
          label={
            etiquetaUnidad
              ? { value: etiquetaUnidad, angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 10 }
              : undefined
          }
        />
        {esPromedio && <ReferenceLine y={0} stroke={tickColor} strokeOpacity={0.5} />}
        <Tooltip
          {...tooltipStyle}
          formatter={(v) => [
            `${formatear(v)}${etiquetaUnidad ? ` ${etiquetaUnidad}` : ''}`,
            esPromedio ? 'Promedio' : 'Registros',
          ]}
        />
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
            formatter={formatear}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </TarjetaGrafica>
  )
}

/**
 * Eje y de un promedio: incluye siempre el 0 (los flujos pueden ser negativos)
 * y deja un margen del 15 % para que las etiquetas no queden pegadas al borde.
 */
function dominioPromedio(valores: number[]): [number, number] {
  const minimo = Math.min(0, ...valores)
  const maximo = Math.max(0, ...valores)
  const margen = (maximo - minimo || 1) * 0.15
  return [minimo < 0 ? minimo - margen : 0, maximo > 0 ? maximo + margen : 0]
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
