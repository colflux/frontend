import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CargandoGrafica, TarjetaGrafica } from '@/components/charts/TarjetaGrafica'
import { useThemeStore } from '@/store/useThemeStore'

export interface BarraConteo {
  nombre: string
  valor: number
}

interface Props {
  titulo: string
  datos: BarraConteo[]
  isLoading?: boolean
  /** Base del porcentaje (p. ej. total de sitios); por defecto, la suma de las barras. */
  total?: number
  /** Nombre de lo que se cuenta, en singular y plural: ['sitio', 'sitios']. */
  unidad: [string, string]
}

const ALTO_BARRA_PX = 26
const ANCHO_ETIQUETAS_PX = 130

/**
 * Barras horizontales ordenadas de mayor a menor, con la cantidad y el
 * porcentaje al final de cada barra. Crece en alto con el número de
 * categorías, así que se leen todas aunque sean muchas. Sin datos, no se muestra.
 */
export function BarrasHorizontalesChart({ titulo, datos, isLoading = false, total, unidad }: Props) {
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  if (isLoading) {
    return (
      <TarjetaGrafica titulo={titulo}>
        <CargandoGrafica alturaPx={220} />
      </TarjetaGrafica>
    )
  }

  const barras = datos.filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor)
  if (!barras.length) return null

  const base = total ?? barras.reduce((s, d) => s + d.valor, 0)
  const porcentaje = (v: number) => `${((v / base) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`
  const etiqueta = (v: unknown) => `${Number(v)} (${porcentaje(Number(v))})`

  return (
    <TarjetaGrafica titulo={titulo}>
      <ResponsiveContainer width="100%" height={barras.length * ALTO_BARRA_PX + 24}>
        <BarChart data={barras} layout="vertical" margin={{ top: 0, right: 72, left: 0, bottom: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="nombre"
            width={ANCHO_ETIQUETAS_PX}
            tick={{ fill: tickColor, fontSize: 10 }}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: isDark ? '#334155' : '#f1f5f9', fillOpacity: 0.5 }}
            contentStyle={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
              borderRadius: 6,
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            formatter={(v) => [
              `${Number(v)} ${Number(v) === 1 ? unidad[0] : unidad[1]} (${porcentaje(Number(v))})`,
              'Total',
            ]}
          />
          <Bar dataKey="valor" fill="#198A77" radius={[0, 3, 3, 0]} barSize={16}>
            <LabelList dataKey="valor" position="right" style={{ fontSize: 10, fill: tickColor }} formatter={etiqueta} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </TarjetaGrafica>
  )
}
