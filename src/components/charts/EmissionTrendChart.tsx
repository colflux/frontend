import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useSeries } from '@/hooks/useSeries'
import { useAppStore } from '@/store/useAppStore'
import { useThemeStore } from '@/store/useThemeStore'
import { GAS_COLORS, formatUnidad } from '@/utils/formatters'
import { CargandoGrafica, TarjetaGrafica } from '@/components/charts/TarjetaGrafica'

interface Props {
  sitioId?: number
  /** Título de la tarjeta; sin datos no se muestra ni la tarjeta. */
  titulo?: string
}

export function EmissionTrendChart({ sitioId, titulo }: Props = {}) {
  const { data: series, isLoading } = useSeries(sitioId != null ? { sitio: sitioId } : {})
  const gas = useAppStore((s) => s.filters.gas)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  const unidades = useMemo(
    () => [...new Set(series?.resultados.map((r) => r.unidad) ?? [])].sort(),
    [series]
  )

  const [unidadElegido, setUnidad] = useState('')

  const unidad = unidades.includes(unidadElegido) ? unidadElegido : (unidades[0] ?? '')

  const data = useMemo(
    () =>
      (series?.resultados ?? [])
        .filter((r) => r.unidad === unidad)
        .map((r) => ({ fecha: r.fecha, valor: r.valor }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [series, unidad]
  )

  if (isLoading) {
    return (
      <TarjetaGrafica titulo={titulo}>
        <CargandoGrafica />
      </TarjetaGrafica>
    )
  }

  if (!unidades.length) return null

  return (
    <TarjetaGrafica titulo={titulo}>
    <div className="flex flex-col gap-2">
      {unidades.length > 1 && (
        <div className="flex gap-1 justify-end">
          {unidades.map((u) => (
            <button
              key={u}
              onClick={() => setUnidad(u)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                u === unidad
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-fg-muted hover:text-fg border border-border'
              }`}
            >
              {formatUnidad(u)}
            </button>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
          <XAxis dataKey="fecha" tick={{ fill: tickColor, fontSize: 11 }} />
          <YAxis tick={{ fill: tickColor, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
              borderRadius: 6,
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            formatter={(v) => [`${v} ${formatUnidad(unidad)}`, gas]}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke={GAS_COLORS[gas]}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    </TarjetaGrafica>
  )
}
