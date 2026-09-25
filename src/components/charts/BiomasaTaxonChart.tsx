import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useBiomasaPorTaxon } from '@/hooks/useBiomasaPorTaxon'
import { useAppStore } from '@/store/useAppStore'
import { useThemeStore } from '@/store/useThemeStore'
import { CargandoGrafica, TarjetaGrafica } from '@/components/charts/TarjetaGrafica'

/** Sin datos no se muestra (ni su tarjeta, si tiene título). */
export function BiomasaTaxonChart({ titulo }: { titulo?: string } = {}) {
  // El "Agrupar por" (Familia/Género/Especie) vive en el panel de filtros
  // (recuadro de Biomasa) en vez de un toggle local, para que quede visible
  // junto al resto de filtros de la metodología.
  const dimension = useAppStore((s) => s.biomasaDimension)
  const { data, isLoading } = useBiomasaPorTaxon(dimension)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  // Conteo de individuos como proxy de "acumulación de biomasa" por taxón:
  // el carbono/producción de biomasa vive a nivel de parcela (MuestraBiomasa),
  // no por individuo, así que no hay un total de carbono exacto por especie
  // con el esquema actual — a validar con el equipo.
  const chartData = [...(data?.resultados ?? [])]
    .sort((a, b) => b.total_individuos - a.total_individuos)
    .slice(0, 12)

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
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 20, right: 4, left: -24, bottom: 40 }}>
          <XAxis
            dataKey="nombre"
            tick={{ fill: tickColor, fontSize: 9 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: tickColor, fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
              borderRadius: 6,
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            formatter={(v) => [`${v} individuos`, 'Total']}
          />
          <Bar dataKey="total_individuos" fill="#739E5B" radius={[3, 3, 0, 0]}>
            <LabelList dataKey="total_individuos" position="top" style={{ fontSize: 10, fill: tickColor }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </TarjetaGrafica>
  )
}
