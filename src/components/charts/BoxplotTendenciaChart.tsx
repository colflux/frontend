import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CargandoGrafica, SelectorGrafica, TarjetaGrafica } from '@/components/charts/TarjetaGrafica'
import { useSeries } from '@/hooks/useSeries'
import { useAppStore } from '@/store/useAppStore'
import { useThemeStore } from '@/store/useThemeStore'
import { GAS_COLORS, formatUnidad } from '@/utils/formatters'
import type { Agrupacion } from '@/types'

const AGRUPACIONES: { valor: Agrupacion; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'anio', etiqueta: 'Año' },
]

interface Caja {
  periodo: string
  n: number
  q1: number
  mediana: number
  q3: number
  bigoteBajo: number
  bigoteAlto: number
  atipicos: number[]
  /** Del menor al mayor valor, incluidos los atípicos: define la barra invisible que ubica la caja. */
  rango: [number, number]
}

/** Cuantil por interpolación lineal (mismo criterio que numpy por defecto). */
function cuantil(ordenados: number[], q: number): number {
  const pos = (ordenados.length - 1) * q
  const base = Math.floor(pos)
  const resto = pos - base
  return ordenados[base + 1] !== undefined
    ? ordenados[base] + resto * (ordenados[base + 1] - ordenados[base])
    : ordenados[base]
}

function caja(periodo: string, valores: number[]): Caja {
  const v = [...valores].sort((a, b) => a - b)
  const q1 = cuantil(v, 0.25)
  const q3 = cuantil(v, 0.75)
  const iqr = q3 - q1
  const dentro = v.filter((x) => x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr)
  return {
    periodo,
    n: v.length,
    q1,
    mediana: cuantil(v, 0.5),
    q3,
    bigoteBajo: dentro[0] ?? q1,
    bigoteAlto: dentro[dentro.length - 1] ?? q3,
    atipicos: v.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr),
    rango: [v[0], v[v.length - 1]],
  }
}

interface FormaCaja {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: Caja
}

/**
 * Dibuja una caja con bigotes sobre la barra invisible [mínimo, máximo] del
 * periodo: la barra da la posición en píxeles de sus extremos, y como la
 * escala es lineal, cualquier otro valor se ubica interpolando entre ellos.
 */
function FiguraCaja({ x = 0, y = 0, width = 0, height = 0, payload, color }: FormaCaja & { color: string }) {
  if (!payload) return null
  const [minimo, maximo] = payload.rango
  const arriba = Math.min(y, y + height)
  const alto = Math.abs(height)
  const px = (v: number) => (maximo === minimo ? arriba : arriba + ((maximo - v) / (maximo - minimo)) * alto)
  const centro = x + width / 2
  const ancho = Math.max(Math.min(width * 0.6, 28), 4)
  return (
    <g>
      <line x1={centro} x2={centro} y1={px(payload.bigoteAlto)} y2={px(payload.q3)} stroke={color} />
      <line x1={centro} x2={centro} y1={px(payload.q1)} y2={px(payload.bigoteBajo)} stroke={color} />
      <line x1={centro - ancho / 4} x2={centro + ancho / 4} y1={px(payload.bigoteAlto)} y2={px(payload.bigoteAlto)} stroke={color} />
      <line x1={centro - ancho / 4} x2={centro + ancho / 4} y1={px(payload.bigoteBajo)} y2={px(payload.bigoteBajo)} stroke={color} />
      <rect
        x={centro - ancho / 2}
        y={px(payload.q3)}
        width={ancho}
        height={Math.max(px(payload.q1) - px(payload.q3), 1)}
        fill={color}
        fillOpacity={0.75}
        stroke={color}
      />
      <line x1={centro - ancho / 2} x2={centro + ancho / 2} y1={px(payload.mediana)} y2={px(payload.mediana)} stroke="#ffffff" strokeWidth={2} />
      {payload.atipicos.map((a, i) => (
        <circle key={i} cx={centro} cy={px(a)} r={2} fill="none" stroke={color} strokeOpacity={0.7} />
      ))}
    </g>
  )
}

const fmt = (v: number) => v.toLocaleString('es-CO', { maximumFractionDigits: 3 })

/**
 * Tendencia de las mediciones del gas elegido como diagrama de cajas y bigotes
 * por mes o por año: caja entre el primer y el tercer cuartil, línea en la
 * mediana, bigotes hasta 1,5 veces el rango intercuartílico y puntos para los
 * valores atípicos. Una sola unidad a la vez: no se mezclan unidades.
 */
export function BoxplotTendenciaChart({ titulo, className }: { titulo: string; className?: string }) {
  const { data: series, isLoading } = useSeries()
  const gas = useAppStore((s) => s.filters.gas)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'
  const color = GAS_COLORS[gas] ?? GAS_COLORS.CO2

  const [agrupar, setAgrupar] = useState<Agrupacion>('mes')
  const [unidadElegida, setUnidad] = useState('')

  const unidades = useMemo(
    () => [...new Set((series?.resultados ?? []).filter((r) => typeof r.valor === 'number').map((r) => r.unidad))].sort(),
    [series]
  )
  const unidad = unidades.includes(unidadElegida) ? unidadElegida : (unidades[0] ?? '')

  const cajas = useMemo(() => {
    const grupos = new Map<string, number[]>()
    for (const r of series?.resultados ?? []) {
      if (typeof r.valor !== 'number' || r.unidad !== unidad) continue
      const periodo = agrupar === 'anio' ? r.fecha.slice(0, 4) : r.fecha.slice(0, 7)
      const valores = grupos.get(periodo)
      if (valores) valores.push(r.valor)
      else grupos.set(periodo, [r.valor])
    }
    return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([p, v]) => caja(p, v))
  }, [series, unidad, agrupar])

  if (isLoading) {
    return (
      <TarjetaGrafica titulo={titulo} className={className}>
        <CargandoGrafica alturaPx={220} />
      </TarjetaGrafica>
    )
  }
  if (!cajas.length) return null

  return (
    <TarjetaGrafica titulo={titulo} className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-3 justify-end">
          <SelectorGrafica opciones={AGRUPACIONES} valor={agrupar} onChange={setAgrupar} />
          {unidades.length > 1 && (
            <SelectorGrafica
              opciones={unidades.map((u) => ({ valor: u, etiqueta: formatUnidad(u) }))}
              valor={unidad}
              onChange={setUnidad}
            />
          )}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={cajas} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <XAxis dataKey="periodo" tick={{ fill: tickColor, fontSize: 10 }} />
            <YAxis
              tick={{ fill: tickColor, fontSize: 10 }}
              domain={['auto', 'auto']}
              tickFormatter={fmt}
              label={{ value: formatUnidad(unidad), angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: isDark ? '#334155' : '#f1f5f9', fillOpacity: 0.5 }}
              content={({ active, payload }) => {
                const c = active ? (payload?.[0]?.payload as Caja | undefined) : undefined
                if (!c) return null
                return (
                  <div
                    className="rounded-md border px-2 py-1 text-xs"
                    style={{
                      background: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8e4',
                      color: isDark ? '#e2e8f0' : '#0f172a',
                    }}
                  >
                    <p className="font-semibold">{c.periodo} · {c.n} mediciones</p>
                    <p>Mediana: {fmt(c.mediana)} {formatUnidad(unidad)}</p>
                    <p>Q1–Q3: {fmt(c.q1)} a {fmt(c.q3)}</p>
                    <p>Bigotes: {fmt(c.bigoteBajo)} a {fmt(c.bigoteAlto)}</p>
                    {c.atipicos.length > 0 && <p>Atípicos: {c.atipicos.length}</p>}
                  </div>
                )
              }}
            />
            <Bar dataKey="rango" fill="transparent" isAnimationActive={false} shape={<FiguraCaja color={color} />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </TarjetaGrafica>
  )
}
