import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/components/common/Card'
import { TourButton } from '@/components/common/TourButton'
import { FilterPanel } from '@/features/filters/FilterPanel'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
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
import { useFlujosFiltros } from '@/hooks/useGlobalFilters'
import { useAppStore } from '@/store/useAppStore'
import { useThemeStore } from '@/store/useThemeStore'
import { PIE_COLORS } from '@/utils/formatters'
import type { GeoResumenFilters } from '@/types'

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
  const flujosFiltros = useFlujosFiltros()
  // Sitios y cobertura de departamentos, acotados por los mismos filtros
  // geográficos/temporales que el mapa -sitios_geojson no acepta "gas".
  const sitiosFiltros = useMemo(() => {
    const f: GeoResumenFilters = { ...flujosFiltros }
    delete f.categoria
    delete f.gas
    return f
  }, [flujosFiltros])
  const { data: sitios, isLoading: sitiosLoading } = useSitios(sitiosFiltros)
  // "Muestras registradas" es un total transversal a todos los gases,
  // independiente del selector "Gas" del panel -de ahí el override-.
  const { data: series, isLoading: seriesLoading } = useSeries({ gas: undefined })
  const { data: departamentosData } = useResumenGeo('departamento', flujosFiltros)
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const flujosAnalizadorId = useAppStore((s) => s.flujosAnalizadorId)
  const setFlujosAnalizadorId = useAppStore((s) => s.setFlujosAnalizadorId)
  const flujosCondicionLuzId = useAppStore((s) => s.flujosCondicionLuzId)
  const setFlujosCondicionLuzId = useAppStore((s) => s.setFlujosCondicionLuzId)

  // dimension="proyecto"/"analizador"/"condicion_luz" no se auto-filtran por
  // su propio valor -colapsarían el gráfico a una sola barra-; selectedId ya
  // resalta la selección visualmente.
  const filtrosSinAnalizador = useMemo(() => {
    const f = { ...flujosFiltros }
    delete f.analizador
    return f
  }, [flujosFiltros])
  const filtrosSinCondicionLuz = useMemo(() => {
    const f = { ...flujosFiltros }
    delete f.condicion_luz
    return f
  }, [flujosFiltros])

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

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'dashboard',
    steps: [
      {
        element: '[data-tour="dashboard-stats"]',
        popover: {
          title: 'Indicadores generales',
          description: 'Muestras, sitios, proyectos y cobertura del territorio, agregados en tiempo real.',
        },
      },
      {
        element: '[data-tour="dashboard-comparativas"]',
        popover: {
          title: 'Distribución de sitios',
          description: 'Cómo se usan los sitios monitoreados y qué porcentaje del territorio ya tiene datos.',
        },
      },
      {
        element: '[data-tour="dashboard-general"]',
        popover: {
          title: 'Sección General',
          description: 'Todo el carbono medido, desglosado por región, ecosistema y estado de conservación.',
        },
      },
      {
        element: '[data-tour="dashboard-flujos"]',
        popover: {
          title: 'Flujos de GEI',
          description: 'CO₂, CH₄ y N₂O por analizador y condición de luz (día/noche).',
        },
      },
    ],
  })

  return (
    <div className="flex-1 p-6 flex gap-6 max-w-7xl mx-auto w-full items-start">
      <TourButton onClick={iniciarTour} />

      <aside data-tour="dashboard-filtros" className="hidden lg:block w-[320px] min-w-[320px] sticky top-6">
        <Card title="Filtros">
          <FilterPanel />
        </Card>
      </aside>

      <div className="flex-1 flex flex-col gap-6 min-w-0">
      <div>
        <h1 className="text-xl font-bold text-fg">Resumen de carbono</h1>
        <p className="text-sm text-fg-muted mt-1">
          Indicadores agregados a partir de los datos disponibles en la plataforma.
        </p>
      </div>

      <div data-tour="dashboard-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div data-tour="dashboard-comparativas" className="grid md:grid-cols-2 gap-4">
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
      <div data-tour="dashboard-general" className="grid md:grid-cols-2 gap-4">
        <Card title="Muestras por región">
          <CategoricalChart dimension="region" tipo="torta" filters={flujosFiltros} />
        </Card>
        <Card title="Muestras por ecosistema / cobertura">
          <CategoricalChart dimension="ecosistema" tipo="barras" filters={flujosFiltros} />
        </Card>
        <Card title="% de participación por estado de conservación">
          <CategoricalChart dimension="estado_conservacion" tipo="torta" filters={flujosFiltros} />
        </Card>
        <Card title="Instalación de unidades de muestreo">
          <InstalacionTrendChart />
        </Card>
      </div>

      <SectionHeader
        title="Flujos de GEI"
        subtitle="CO₂ / CH₄ / N₂O, en la unidad reportada por cada muestra."
      />
      <div data-tour="dashboard-flujos" className="grid md:grid-cols-2 gap-4">
        <Card title="Flujo por analizador">
          <CategoricalChart
            dimension="analizador"
            tipo="barras"
            metrica="promedio"
            filters={filtrosSinAnalizador}
            selectedId={flujosAnalizadorId}
            onSelect={(id) => setFlujosAnalizadorId(id === flujosAnalizadorId ? null : id)}
          />
        </Card>
        <Card title="Flujo por condición de luz (día/noche)">
          <CategoricalChart
            dimension="condicion_luz"
            tipo="barras"
            metrica="promedio"
            filters={filtrosSinCondicionLuz}
            selectedId={flujosCondicionLuzId}
            onSelect={(id) => setFlujosCondicionLuzId(id === flujosCondicionLuzId ? null : id)}
          />
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
    </div>
  )
}
