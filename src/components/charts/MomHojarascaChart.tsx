import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useMomTendencia } from '@/hooks/useMomTendencia'
import { useThemeStore } from '@/store/useThemeStore'
import type { Agrupacion } from '@/types'
import { CargandoGrafica, TarjetaGrafica } from '@/components/charts/TarjetaGrafica'

const AGRUPACIONES: { valor: Agrupacion; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'anio', etiqueta: 'Año' },
]

/** Sin datos no se muestra (ni su tarjeta, si tiene título). */
export function MomHojarascaChart({ titulo }: { titulo?: string } = {}) {
  const [agrupar, setAgrupar] = useState<Agrupacion>('mes')
  const { data, isLoading } = useMomTendencia(agrupar)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  const chartData = (data?.resultados ?? []).map((r) => ({
    periodo: agrupar === 'anio' ? r.periodo.slice(0, 4) : r.periodo.slice(0, 7),
    valor: Number(r.carbono_hojarasca_g_m2_promedio),
  }))

  if (isLoading) {
    return (
      <TarjetaGrafica titulo={titulo}>
        <CargandoGrafica />
      </TarjetaGrafica>
    )
  }

  if (!chartData.length) return null

  return (
    <TarjetaGrafica titulo={titulo}>
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
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
          <XAxis dataKey="periodo" tick={{ fill: tickColor, fontSize: 11 }} />
          <YAxis tick={{ fill: tickColor, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
              borderRadius: 6,
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            formatter={(v) => [`${Number(v).toFixed(1)} g/m²`, 'Carbono en hojarasca']}
          />
          <Line type="monotone" dataKey="valor" stroke="#57270F" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    </TarjetaGrafica>
  )
}
