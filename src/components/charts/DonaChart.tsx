import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DonutCenterOverlay } from '@/components/charts/CategoricalChart'
import { CargandoGrafica, TarjetaGrafica } from '@/components/charts/TarjetaGrafica'
import { useThemeStore } from '@/store/useThemeStore'
import { PIE_COLORS } from '@/utils/formatters'

export interface PorcionDona {
  nombre: string
  valor: number
}

interface Props {
  titulo: string
  datos: PorcionDona[]
  isLoading?: boolean
  /** Texto bajo el total del centro, p. ej. «Sitios». */
  subtitulo: string
  /** Muestra el porcentaje de cada porción en la leyenda y el tooltip. */
  porcentajes?: boolean
  /** Total del centro, si no es la suma de las porciones (p. ej. sitios que cuentan en varias). */
  total?: number
  alturaPx?: number
  /** Máximo de porciones; el resto se agrupa en «Otras». */
  maxPorciones?: number
}

/** Dona de conteos con el total al centro. Sin datos, no se muestra. */
export function DonaChart({
  titulo,
  datos,
  isLoading = false,
  subtitulo,
  porcentajes = false,
  total,
  alturaPx = 240,
  maxPorciones = 8,
}: Props) {
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  if (isLoading) {
    return (
      <TarjetaGrafica titulo={titulo}>
        <CargandoGrafica alturaPx={alturaPx} />
      </TarjetaGrafica>
    )
  }

  const ordenados = datos.filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor)
  if (!ordenados.length) return null

  const porciones =
    ordenados.length > maxPorciones
      ? [
          ...ordenados.slice(0, maxPorciones - 1),
          { nombre: 'Otras', valor: ordenados.slice(maxPorciones - 1).reduce((s, d) => s + d.valor, 0) },
        ]
      : ordenados
  const suma = porciones.reduce((s, d) => s + d.valor, 0)
  const pct = (v: number) => `${((v / suma) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`

  return (
    <TarjetaGrafica titulo={titulo}>
      <div className="relative">
        <ResponsiveContainer width="100%" height={alturaPx}>
          <PieChart>
            <Pie data={porciones} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={80}>
              {porciones.map((p, i) => (
                <Cell key={p.nombre} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              wrapperStyle={{ fontSize: 11, color: tickColor }}
              formatter={(nombre: string) =>
                porcentajes ? `${nombre} (${pct(porciones.find((p) => p.nombre === nombre)?.valor ?? 0)})` : nombre
              }
            />
            <Tooltip
              contentStyle={{
                background: isDark ? '#1e293b' : '#ffffff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
                borderRadius: 6,
              }}
              formatter={(v, nombre) => [porcentajes ? `${v} (${pct(Number(v))})` : v, nombre]}
            />
          </PieChart>
        </ResponsiveContainer>
        <DonutCenterOverlay total={total ?? suma} subtitulo={subtitulo} isDark={isDark} paddingBottomPx={28} />
      </div>
    </TarjetaGrafica>
  )
}
