import { useMemo } from 'react'
import { Select } from '@/components/common/Select'
import { Collapsible } from '@/components/common/Collapsible'
import { useAppStore } from '@/store/useAppStore'
import { useSitios } from '@/hooks/useSitios'
import { useResumenGeo } from '@/hooks/useResumenGeo'
import { useResumenCategorico } from '@/hooks/useResumenCategorico'
import { useCosPorProfundidad } from '@/hooks/useCosPorProfundidad'
import { buildGeoResumenBaseFilters, metodologiaToCategoria } from '@/utils/geoFilters'
import { GAS_LABELS } from '@/utils/formatters'
import type { DimensionBiomasa, GasType, Metodologia, SitioProyecto } from '@/types'

const GAS_OPTIONS: { value: GasType; label: string; disabled?: boolean }[] = [
  { value: 'CO2', label: GAS_LABELS.CO2 },
  { value: 'CH4', label: GAS_LABELS.CH4 },
  { value: 'N2O', label: GAS_LABELS.N2O, disabled: true },
]

const METODOLOGIA_OPTIONS: { value: Metodologia; label: string }[] = [
  { value: 'biomasa', label: 'Biomasa' },
  { value: 'cos', label: 'Carbono orgánico del suelo (COS)' },
  { value: 'flujos', label: 'Flujos de GEI' },
]

const BIOMASA_DIMENSION_OPTIONS: { value: DimensionBiomasa; label: string }[] = [
  { value: 'familia', label: 'Familia' },
  { value: 'genero', label: 'Género' },
  { value: 'especie', label: 'Especie' },
]

export function FilterPanel() {
  const {
    filters,
    setYear,
    setGas,
    setProyecto,
    metodologia,
    setMetodologia,
    region,
    departamento,
    municipio,
    vereda,
    setRegion,
    setDepartamento,
    setMunicipio,
    setVereda,
    biomasaDimension,
    setBiomasaDimension,
    cosProfundidad,
    setCosProfundidad,
    flujosAnalizadorId,
    setFlujosAnalizadorId,
    flujosCondicionLuzId,
    setFlujosCondicionLuzId,
  } = useAppStore()
  const { data: sitios } = useSitios()

  const years = useMemo(() => {
    const set = new Set<number>()
    sitios?.features.forEach((f) => {
      const { desde, hasta } = f.properties.rango_fechas
      const from = desde ? new Date(desde).getFullYear() : null
      const to = hasta ? new Date(hasta).getFullYear() : null
      if (from != null && to != null) {
        for (let y = from; y <= to; y++) set.add(y)
      } else if (from != null) {
        set.add(from)
      } else if (to != null) {
        set.add(to)
      }
    })
    return [...set].sort((a, b) => b - a)
  }, [sitios])

  const proyectos = useMemo(() => {
    const map = new Map<number, SitioProyecto>()
    sitios?.features.forEach((f) => {
      f.properties.proyectos.forEach((p) => map.set(p.id, p))
    })
    return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [sitios])

  const categoria = useMemo(() => metodologiaToCategoria(metodologia), [metodologia])
  const baseGeoFilters = useMemo(() => buildGeoResumenBaseFilters(filters, metodologia), [filters, metodologia])

  const { data: regionesData } = useResumenGeo('region', baseGeoFilters)
  const { data: departamentosData } = useResumenGeo('departamento', baseGeoFilters)
  const { data: municipiosData } = useResumenGeo(
    'municipio',
    { ...baseGeoFilters, departamento: departamento?.id },
    departamento != null
  )
  const { data: veredasData } = useResumenGeo(
    'vereda',
    { ...baseGeoFilters, municipio: municipio?.id },
    municipio != null
  )

  const regionOptions = useMemo(
    () => [...(regionesData?.features ?? [])].sort((a, b) => a.properties.nombre.localeCompare(b.properties.nombre)),
    [regionesData]
  )
  const departamentoOptions = useMemo(
    () => [...(departamentosData?.features ?? [])].sort((a, b) => a.properties.nombre.localeCompare(b.properties.nombre)),
    [departamentosData]
  )
  const municipioOptions = useMemo(
    () => [...(municipiosData?.features ?? [])].sort((a, b) => a.properties.nombre.localeCompare(b.properties.nombre)),
    [municipiosData]
  )
  const veredaOptions = useMemo(
    () => [...(veredasData?.features ?? [])].sort((a, b) => a.properties.nombre.localeCompare(b.properties.nombre)),
    [veredasData]
  )

  // Los recuadros condicionales solo hacen fetch de sus propias opciones
  // cuando esa metodología está activa.
  const { data: cosData } = useCosPorProfundidad()
  const { data: analizadorData } = useResumenCategorico('analizador', {}, metodologia === 'flujos')
  const { data: condicionLuzData } = useResumenCategorico('condicion_luz', {}, metodologia === 'flujos')

  return (
    <div className="flex flex-col gap-4">
      {/* Metodología: siempre visible/expandido, es el filtro principal que
          determina qué categoría de dato pinta el mapa y qué recuadro
          condicional (Biomasa/COS/Flujos) aparece. */}
      <p className="text-xs text-fg-muted font-semibold uppercase tracking-wider">Metodología</p>
      <Select
        label="Metodología"
        value={metodologia}
        options={METODOLOGIA_OPTIONS}
        onChange={(v) => setMetodologia(v as Metodologia)}
      />
      {/* Gas es un sub-filtro exclusivo de la categoría "flujos" -biomasa y
          cos no lo soportan en el backend-. */}
      {categoria === 'flujos' && (
        <Select
          label="Gas"
          value={filters.gas}
          options={GAS_OPTIONS}
          onChange={(v) => setGas(v as GasType)}
        />
      )}

      {metodologia === 'biomasa' && (
        <div className="flex flex-col gap-4">
          <Select
            label="Agrupar por"
            value={biomasaDimension}
            options={BIOMASA_DIMENSION_OPTIONS}
            onChange={(v) => setBiomasaDimension(v as DimensionBiomasa)}
          />
          <Select
            label="DAP"
            value=""
            disabled
            options={[{ value: '', label: 'Próximamente' }]}
            onChange={() => {}}
          />
        </div>
      )}

      {metodologia === 'cos' && (
        <div className="flex flex-col gap-4">
          <Select
            label="Profundidad de muestra"
            value={cosProfundidad ?? ''}
            options={[
              { value: '', label: 'Todos los rangos' },
              ...(cosData?.resultados ?? []).map((r) => ({
                value: r.rango_profundidad,
                label: r.rango_profundidad,
              })),
            ]}
            onChange={(v) => setCosProfundidad(v || null)}
          />
        </div>
      )}

      {metodologia === 'flujos' && (
        <div className="flex flex-col gap-4">
          <Select
            label="Analizador"
            value={flujosAnalizadorId != null ? String(flujosAnalizadorId) : ''}
            options={[
              { value: '', label: 'Todos los analizadores' },
              ...(analizadorData?.resultados ?? []).map((r) => ({ value: String(r.id), label: r.nombre })),
            ]}
            onChange={(v) => setFlujosAnalizadorId(v || null)}
          />
          <Select
            label="Día / noche"
            value={flujosCondicionLuzId != null ? String(flujosCondicionLuzId) : ''}
            options={[
              { value: '', label: 'Todas' },
              ...(condicionLuzData?.resultados ?? []).map((r) => ({ value: String(r.id), label: r.nombre })),
            ]}
            onChange={(v) => setFlujosCondicionLuzId(v || null)}
          />
        </div>
      )}

      <Collapsible title="Temporal">
        <Select
          label="Año"
          value={filters.year != null ? String(filters.year) : ''}
          options={[
            { value: '', label: 'Todos los años' },
            ...years.map((y) => ({ value: String(y), label: String(y) })),
          ]}
          onChange={(v) => setYear(v ? Number(v) : null)}
        />
        <Select
          label="Fecha (año - día)"
          value=""
          disabled
          options={[{ value: '', label: 'Próximamente' }]}
          onChange={() => {}}
        />
      </Collapsible>

      <Collapsible title="Espacial">
        <Select
          label="Proyecto / Entidad"
          value={filters.proyectoId != null ? String(filters.proyectoId) : ''}
          options={[
            { value: '', label: 'Todos los proyectos' },
            ...proyectos.map((p) => ({ value: String(p.id), label: p.nombre })),
          ]}
          onChange={(v) => setProyecto(v ? Number(v) : null)}
        />

        <Select
          label="Región"
          value={region != null ? String(region.id) : ''}
          options={[
            { value: '', label: 'Todas las regiones' },
            ...regionOptions.map((f) => ({ value: String(f.properties.id), label: f.properties.nombre })),
          ]}
          onChange={(v) => {
            if (!v) return setRegion(null)
            const f = regionOptions.find((f) => String(f.properties.id) === v)
            if (f) setRegion({ id: f.properties.id, nombre: f.properties.nombre })
          }}
        />

        <Select
          label="Departamento"
          value={departamento != null ? String(departamento.id) : ''}
          options={[
            { value: '', label: 'Todos los departamentos' },
            ...departamentoOptions.map((f) => ({ value: String(f.properties.id), label: f.properties.nombre })),
          ]}
          onChange={(v) => {
            if (!v) return setDepartamento(null)
            const f = departamentoOptions.find((f) => String(f.properties.id) === v)
            if (f) setDepartamento({ id: f.properties.id, nombre: f.properties.nombre })
          }}
        />

        <Select
          label="Municipio"
          value={municipio != null ? String(municipio.id) : ''}
          options={[
            { value: '', label: departamento ? 'Todos los municipios' : 'Elegí un departamento primero' },
            ...municipioOptions.map((f) => ({ value: String(f.properties.id), label: f.properties.nombre })),
          ]}
          onChange={(v) => {
            if (!v) return setMunicipio(null)
            const f = municipioOptions.find((f) => String(f.properties.id) === v)
            if (f) setMunicipio({ id: f.properties.id, nombre: f.properties.nombre })
          }}
        />

        <Select
          label="Vereda / Casco urbano"
          value={vereda != null ? String(vereda.id) : ''}
          options={[
            { value: '', label: municipio ? 'Todas las veredas' : 'Elegí un municipio primero' },
            ...veredaOptions.map((f) => ({ value: String(f.properties.id), label: f.properties.nombre })),
          ]}
          onChange={(v) => {
            if (!v) return setVereda(null)
            const f = veredaOptions.find((f) => String(f.properties.id) === v)
            if (f) setVereda({ id: f.properties.id, nombre: f.properties.nombre })
          }}
        />
      </Collapsible>

      <Collapsible title="Ambiental">
        <Select
          label="Ecosistema / Cobertura"
          value=""
          disabled
          options={[{ value: '', label: 'Próximamente' }]}
          onChange={() => {}}
        />
        <Select
          label="Estado de conservación"
          value=""
          disabled
          options={[{ value: '', label: 'Próximamente' }]}
          onChange={() => {}}
        />
      </Collapsible>
    </div>
  )
}
