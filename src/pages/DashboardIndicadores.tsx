import { useMemo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { TourButton } from '@/components/common/TourButton'
import { FilterPanel } from '@/features/filters/FilterPanel'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import { BarrasHorizontalesChart } from '@/components/charts/BarrasHorizontalesChart'
import { BoxplotTendenciaChart } from '@/components/charts/BoxplotTendenciaChart'
import { CategoricalChart } from '@/components/charts/CategoricalChart'
import { DonaChart } from '@/components/charts/DonaChart'
import { MuestreosPorPeriodoChart } from '@/components/charts/MuestreosPorPeriodoChart'
import { SelectorGrafica } from '@/components/charts/TarjetaGrafica'
import { BiomasaTaxonChart } from '@/components/charts/BiomasaTaxonChart'
import { BiomasaProduccionScatter } from '@/components/charts/BiomasaProduccionScatter'
import { CosProfundidadChart } from '@/components/charts/CosProfundidadChart'
import { MomHojarascaChart } from '@/components/charts/MomHojarascaChart'
import { useSitios } from '@/hooks/useSitios'
import { useSeries } from '@/hooks/useSeries'
import { useResumenGeo } from '@/hooks/useResumenGeo'
import { useFlujosFiltros } from '@/hooks/useGlobalFilters'
import { useAppStore } from '@/store/useAppStore'
import { GAS_CORTO, formatUnidad } from '@/utils/formatters'
import type { GeoResumenFilters, SitioFeature } from '@/types'

const TOTAL_DEPARTAMENTOS_COLOMBIA = 33

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mt-2">
      <h2 className="text-base font-bold text-fg">{title}</h2>
      {subtitle && <p className="text-xs text-fg-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}

/** Un sitio cuenta como monitoreado si tiene alguna medición: de gases, biomasa o COS. */
function tieneDatos(sitio: SitioFeature): boolean {
  const p = sitio.properties
  return Object.keys(p.resumen_por_gas ?? {}).length > 0 || p.resumen_biomasa != null || p.resumen_cos != null
}

/** Cuántos sitios hay por cada valor de `clave` (un sitio puede contar en varios). */
function contarSitios(sitios: SitioFeature[], clave: (s: SitioFeature) => (string | null)[]) {
  const conteo = new Map<string, number>()
  for (const s of sitios) {
    for (const nombre of new Set(clave(s).filter((n): n is string => !!n))) {
      conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1)
    }
  }
  return [...conteo.entries()].map(([nombre, valor]) => ({ nombre, valor }))
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
  // Mediciones del gas elegido en el panel de filtros: el total de muestras,
  // las unidades disponibles y las gráficas de tendencia salen de aquí.
  const { data: series, isLoading: seriesLoading } = useSeries()
  const { data: departamentosData } = useResumenGeo('departamento', flujosFiltros)
  const gas = useAppStore((s) => s.filters.gas)
  // La metodología elegida en el panel decide qué secciones se ven: «General»
  // muestra todas; Flujos, Biomasa o COS, solo las suyas.
  const metodologia = useAppStore((s) => s.metodologia)
  const ver = {
    flujos: metodologia === 'general' || metodologia === 'flujos',
    biomasa: metodologia === 'general' || metodologia === 'biomasa',
    cos: metodologia === 'general' || metodologia === 'cos',
    mom: metodologia === 'general',
  }
  const flujosAnalizadorId = useAppStore((s) => s.flujosAnalizadorId)
  const setFlujosAnalizadorId = useAppStore((s) => s.setFlujosAnalizadorId)
  const flujosCondicionLuzId = useAppStore((s) => s.flujosCondicionLuzId)
  const setFlujosCondicionLuzId = useAppStore((s) => s.setFlujosCondicionLuzId)

  // dimension="analizador"/"condicion_luz" no se auto-filtran por su propio
  // valor -colapsarían el gráfico a una sola barra-; selectedId ya resalta la
  // selección visualmente.
  const filtrosSinAnalizador = useMemo(() => {
    const f = { ...flujosFiltros }
    delete f.analizador
    return f
  }, [flujosFiltros])

  // El promedio por condición de luz se calcula dentro de una sola unidad.
  const unidades = useMemo(
    () => [...new Set((series?.resultados ?? []).map((r) => r.unidad))].filter(Boolean).sort(),
    [series]
  )
  const [unidadElegida, setUnidadElegida] = useState('')
  const unidadLuz = unidades.includes(unidadElegida) ? unidadElegida : (unidades[0] ?? '')
  const filtrosLuz = useMemo(() => {
    const f: GeoResumenFilters = { ...flujosFiltros, unidad: unidadLuz || undefined }
    delete f.condicion_luz
    return f
  }, [flujosFiltros, unidadLuz])

  const sitiosConDatos = useMemo(() => (sitios?.features ?? []).filter(tieneDatos), [sitios])
  const sitiosPorUnidadExperimental = useMemo(
    () => contarSitios(sitiosConDatos, (s) => s.properties.unidades_muestreo.map((um) => um.unidad_experimental)),
    [sitiosConDatos]
  )
  // Estado de conservación: sobre todos los sitios registrados, porque es un
  // atributo del lugar y no depende de que ya tenga mediciones.
  const sitiosPorEstado = useMemo(
    () => contarSitios(sitios?.features ?? [], (s) => [s.properties.estado_conservacion]),
    [sitios]
  )

  const departamentosConDatos = departamentosData?.features.length ?? 0
  const coberturaPct = Math.round((departamentosConDatos / TOTAL_DEPARTAMENTOS_COLOMBIA) * 100)
  const totalMuestras = series?.count ?? 0
  const proyectosActivos = useMemo(() => {
    const ids = new Set<number>()
    sitiosConDatos.forEach((f) => f.properties.proyectos.forEach((p) => ids.add(p.id)))
    return ids.size
  }, [sitiosConDatos])

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'dashboard',
    steps: [
      {
        element: '[data-tour="dashboard-stats"]',
        popover: {
          title: 'Indicadores generales',
          description: 'Muestras del gas elegido, sitios con mediciones, proyectos y cobertura del territorio.',
        },
      },
      {
        element: '[data-tour="dashboard-comparativas"]',
        popover: {
          title: 'Unidades experimentales y tendencia',
          description: 'Muestras y sitios por unidad experimental, y cómo se distribuyen las mediciones en el tiempo.',
        },
      },
      {
        element: '[data-tour="dashboard-general"]',
        popover: {
          title: 'Sección General',
          description: 'Muestras por región y ecosistema, estado de conservación de los sitios y muestreos por periodo.',
        },
      },
      {
        element: '[data-tour="dashboard-flujos"]',
        popover: {
          title: 'Flujos de GEI',
          description: 'Muestras por analizador y flujo promedio de día y de noche, en una unidad a la vez.',
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

      <div
        data-tour="dashboard-stats"
        className={`grid grid-cols-2 gap-4 ${ver.flujos ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
      >
        {ver.flujos && (
          <Card>
            <p className="text-2xl font-bold text-fg">
              {seriesLoading ? '…' : totalMuestras.toLocaleString('es-CO')}
            </p>
            <p className="text-xs text-fg-muted mt-1">Muestras de {GAS_CORTO[gas] ?? gas}</p>
          </Card>
        )}
        <Card>
          <p className="text-2xl font-bold text-fg">{sitiosLoading ? '…' : sitiosConDatos.length}</p>
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

      {ver.flujos && (
      <section data-tour="dashboard-comparativas" className="seccion-graficas grid md:grid-cols-2 gap-4">
        <CategoricalChart
          titulo="Muestras por unidad experimental"
          dimension="unidad_experimental"
          tipo="barras"
          filters={flujosFiltros}
        />
        <BarrasHorizontalesChart
          titulo="Sitios por unidad experimental"
          datos={sitiosPorUnidadExperimental}
          isLoading={sitiosLoading}
          total={sitiosConDatos.length}
          unidad={['sitio', 'sitios']}
        />
        <BoxplotTendenciaChart titulo="Tendencia de mediciones" className="md:col-span-2" />
      </section>
      )}

      {ver.flujos && (
      <section className="seccion-graficas flex flex-col gap-4">
        <SectionHeader
          title="General"
          subtitle="Todo el carbono medido, por región, ecosistema y estado de conservación."
        />
        <div data-tour="dashboard-general" className="grid md:grid-cols-2 gap-4">
          <CategoricalChart titulo="Muestras por región" dimension="region" tipo="torta" filters={flujosFiltros} />
          <CategoricalChart
            titulo="Muestras por ecosistema / cobertura"
            dimension="ecosistema"
            tipo="barras"
            filters={flujosFiltros}
          />
          <DonaChart
            titulo="% de participación por estado de conservación"
            datos={sitiosPorEstado}
            isLoading={sitiosLoading}
            subtitulo="Sitios"
            porcentajes
          />
          <MuestreosPorPeriodoChart />
        </div>
      </section>
      )}

      {ver.flujos && (
      <section className="seccion-graficas flex flex-col gap-4">
        <SectionHeader
          title="Flujos de GEI"
          subtitle="CO₂ / CH₄ / N₂O. Los promedios se calculan dentro de una misma unidad."
        />
        <div data-tour="dashboard-flujos" className="grid md:grid-cols-2 gap-4">
          <CategoricalChart
            titulo="Muestras por analizador"
            dimension="analizador"
            tipo="barras"
            filters={filtrosSinAnalizador}
            selectedId={flujosAnalizadorId}
            onSelect={(id) => setFlujosAnalizadorId(id === flujosAnalizadorId ? null : id)}
          />
          <CategoricalChart
            titulo="Flujo promedio por condición de luz (día/noche)"
            dimension="condicion_luz"
            tipo="barras"
            metrica="promedio"
            unidad={unidadLuz}
            filters={filtrosLuz}
            selectedId={flujosCondicionLuzId}
            onSelect={(id) => setFlujosCondicionLuzId(id === flujosCondicionLuzId ? null : id)}
            controles={
              unidades.length > 1 ? (
                <SelectorGrafica
                  opciones={unidades.map((u) => ({ valor: u, etiqueta: formatUnidad(u) }))}
                  valor={unidadLuz}
                  onChange={setUnidadElegida}
                />
              ) : undefined
            }
          />
        </div>
      </section>
      )}

      {ver.biomasa && (
      <section className="seccion-graficas flex flex-col gap-4">
        <SectionHeader
          title="Biomasa"
          subtitle="Individuos arbóreos por taxón y producción de biomasa aérea por parcela."
        />
        <div className="grid md:grid-cols-2 gap-4">
          <BiomasaTaxonChart titulo="Individuos por taxón" />
          <BiomasaProduccionScatter titulo="Producción de biomasa" />
        </div>
      </section>
      )}

      {ver.cos && (
      <section className="seccion-graficas flex flex-col gap-4">
        <SectionHeader title="Carbono orgánico del suelo (COS)" />
        <div className="grid md:grid-cols-2 gap-4">
          <CosProfundidadChart titulo="% de carbono por rango de profundidad" />
        </div>
      </section>
      )}

      {ver.mom && (
      <section className="seccion-graficas flex flex-col gap-4">
        <SectionHeader title="Materia orgánica muerta (MOM)" subtitle="Carbono en hojarasca." />
        <div className="grid md:grid-cols-2 gap-4">
          <MomHojarascaChart titulo="Carbono en hojarasca (g/m²)" />
        </div>
      </section>
      )}
      </div>
    </div>
  )
}
