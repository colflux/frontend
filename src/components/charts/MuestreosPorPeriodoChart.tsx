import { useMemo, useState } from 'react'
import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CargandoGrafica, SelectorGrafica, TarjetaGrafica } from '@/components/charts/TarjetaGrafica'
import { useSeries } from '@/hooks/useSeries'
import { useAppStore } from '@/store/useAppStore'
import { useThemeStore } from '@/store/useThemeStore'
import { GAS_COLORS } from '@/utils/formatters'
import type { Agrupacion } from '@/types'

const AGRUPACIONES: { valor: Agrupacion; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'anio', etiqueta: 'Año' },
]

/**
 * Número de muestreos (mediciones de flujo) del gas elegido por mes o por año,
 * contados a partir de la fecha de cada toma. Reemplaza la gráfica de
 * instalación de unidades de muestreo, cuya fecha de instalación no es confiable.
 */
export function MuestreosPorPeriodoChart({ className }: { className?: string }) {
  const [agrupar, setAgrupar] = useState<Agrupacion>('anio')
  const { data: series, isLoading } = useSeries()
  const gas = useAppStore((s) => s.filters.gas)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'
  const titulo = agrupar === 'anio' ? 'Número de muestreos por año' : 'Número de muestreos por mes'

  const datos = useMemo(() => {
    const conteo = new Map<string, number>()
    for (const r of series?.resultados ?? []) {
      const periodo = agrupar === 'anio' ? r.fecha.slice(0, 4) : r.fecha.slice(0, 7)
      conteo.set(periodo, (conteo.get(periodo) ?? 0) + 1)
    }
    return [...conteo.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodo, total]) => ({ periodo, total }))
  }, [series, agrupar])

  if (isLoading) {
    return (
      <TarjetaGrafica titulo={titulo} className={className}>
        <CargandoGrafica alturaPx={200} />
      </TarjetaGrafica>
    )
  }
  if (!datos.length) return null

  return (
    <TarjetaGrafica titulo={titulo} className={className}>
      <div className="flex flex-col gap-2">
        <SelectorGrafica opciones={AGRUPACIONES} valor={agrupar} onChange={setAgrupar} />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={datos} margin={{ top: 20, right: 4, left: -16, bottom: 0 }}>
            <XAxis dataKey="periodo" tick={{ fill: tickColor, fontSize: 10 }} />
            <YAxis tick={{ fill: tickColor, fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: isDark ? '#1e293b' : '#ffffff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
                borderRadius: 6,
              }}
              labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
              formatter={(v) => [`${Number(v).toLocaleString('es-CO')} mediciones`, 'Muestreos']}
            />
            <Bar dataKey="total" fill={GAS_COLORS[gas] ?? GAS_COLORS.CO2} radius={[3, 3, 0, 0]}>
              {agrupar === 'anio' && (
                <LabelList dataKey="total" position="top" style={{ fontSize: 10, fill: tickColor }} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </TarjetaGrafica>
  )
}
