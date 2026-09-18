import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/components/common/Card'
import { EmissionBarChart } from '@/components/charts/EmissionBarChart'
import { EmissionTrendChart } from '@/components/charts/EmissionTrendChart'
import { CategoricalChart, DonutCenterOverlay } from '@/components/charts/CategoricalChart'
import { InstalacionTrendChart } from '@/components/charts/InstalacionTrendChart'
import { BiomasaTaxonChart } from '@/components/charts/BiomasaTaxonChart'
import { BiomasaProduccionScatter } from '@/components/charts/BiomasaProduccionScatter'
import { CosProfundidadChart } from '@/components/charts/CosProfundidadChart'
import { MomHojarascaChart } from '@/components/charts/MomHojarascaChart'
import { useSitios } from '@/hooks/useSitios'
import { useSeries } from '@/hooks/useSeries'
import { useResumenGeo } from '@/hooks/useResumenGeo'
import { useThemeStore } from '@/store/useThemeStore'
import { PIE_COLORS } from '@/utils/formatters'

const TOTAL_DEPARTAMENTOS_COLOMBIA = 33

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mt-2">
      <h2 className="text-base font-bold text-fg">{title}</h2>
      {subtitle && <p className="text-xs text-fg-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}

export function DashboardIndicadores() {
  const { data: sitios, isLoading: sitiosLoading } = useSitios()
  const { data: series, isLoading: seriesLoading } = useSeries({ gas: undefined })
  const { data: departamentosData } = useResumenGeo('departamento', {})
  const isDark = useThemeStore((s) => s.theme === 'dark')

  const usoDistribucion = useMemo(() => {
    const counts = new Map<string, number>()
    sitios?.features.forEach((f) => {
      const key = f.properties.uso_actual || 'Sin especificar'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [sitios])

  const departamentosConDatos = departamentosData?.features.length ?? 0
  const coberturaPct = Math.round((departamentosConDatos / TOTAL_DEPARTAMENTOS_COLOMBIA) * 100)
  const coberturaData = [
    { name: 'Con datos', value: departamentosConDatos },
    { name: 'Sin datos', value: Math.max(TOTAL_DEPARTAMENTOS_COLOMBIA - departamentosConDatos, 0) },
  ]

  const sitiosActivos = sitios?.features.length ?? 0
  const totalMuestras = series?.count ?? 0
  const proyectosActivos = useMemo(() => {
    const ids = new Set<number>()
    sitios?.features.forEach((f) => f.properties.proyectos.forEach((p) => ids.add(p.id)))
    return ids.size
  }, [sitios])

  const tickColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-fg">Resumen de carbono</h1>
        <p className="text-sm text-fg-muted mt-1">
          Indicadores agregados a partir de los datos disponibles en la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-2xl font-bold text-fg">
            {seriesLoading ? '…' : totalMuestras.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-fg-muted mt-1">Muestras registradas</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-fg">{sitiosLoading ? '…' : sitiosActivos}</p>
          <p className="text-xs text-fg-muted mt-1">Sitios monitoreados</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-fg">{sitiosLoading ? '…' : proyectosActivos}</p>
          <p className="text-xs text-fg-muted mt-1">Proyectos activos</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-fg">{coberturaPct}%</p>
          <p className="text-xs text-fg-muted mt-1">Cobertura del territorio</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Muestras por proyecto">
          <EmissionBarChart />
        </Card>
        <Card title="Tendencia de mediciones">
          <EmissionTrendChart />
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Distribución por uso del sitio">
          {usoDistribucion.length ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={usoDistribucion} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {usoDistribucion.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11, color: tickColor }} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? '#1e293b' : '#ffffff',
                      border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
                      borderRadius: 6,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenterOverlay total={sitiosActivos} subtitulo="Sitios" isDark={isDark} paddingBottomPx={28} />
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-fg-subtle text-sm">
              Sin datos
            </div>
          )}
        </Card>

        <Card title="Cobertura de datos">
          <div className="relative">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={coberturaData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                <Cell fill="#198A77" />
                <Cell fill={isDark ? '#334155' : '#e2e8e4'} />
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, color: tickColor }} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
                  borderRadius: 6,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <DonutCenterOverlay total={coberturaPct} subtitulo="% cobertura" isDark={isDark} paddingBottomPx={28} />
          </div>
          <p className="text-xs text-fg-muted text-center mt-1">
            {departamentosConDatos} de {TOTAL_DEPARTAMENTOS_COLOMBIA} departamentos con datos
          </p>
        </Card>
      </div>

      <SectionHeader
        title="General"
        subtitle="Todo el carbono medido, por región, ecosistema y estado de conservación."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Muestras por región">
          <CategoricalChart dimension="region" tipo="torta" />
        </Card>
        <Card title="Muestras por ecosistema / cobertura">
          <CategoricalChart dimension="ecosistema" tipo="barras" />
        </Card>
        <Card title="% de participación por estado de conservación">
          <CategoricalChart dimension="estado_conservacion" tipo="torta" />
        </Card>
        <Card title="Instalación de unidades de muestreo">
          <InstalacionTrendChart />
        </Card>
      </div>

      <SectionHeader
        title="Flujos de GEI"
        subtitle="CO₂ / CH₄ / N₂O, en la unidad reportada por cada muestra."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Flujo por analizador">
          <CategoricalChart dimension="analizador" tipo="barras" metrica="promedio" />
        </Card>
        <Card title="Flujo por condición de luz (día/noche)">
          <CategoricalChart dimension="condicion_luz" tipo="barras" metrica="promedio" />
        </Card>
      </div>

      <SectionHeader
        title="Biomasa"
        subtitle="Individuos arbóreos por taxón y producción de biomasa aérea por parcela."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Individuos por taxón">
          <BiomasaTaxonChart />
        </Card>
        <Card title="Producción de biomasa">
          <BiomasaProduccionScatter />
        </Card>
      </div>

      <SectionHeader title="Carbono orgánico del suelo (COS)" />
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="% de carbono por rango de profundidad">
          <CosProfundidadChart />
        </Card>
      </div>

      <SectionHeader
        title="Materia orgánica muerta (MOM)"
        subtitle="Carbono en hojarasca."
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Carbono en hojarasca (g/m²)">
          <MomHojarascaChart />
        </Card>
      </div>
    </div>
  )
}
