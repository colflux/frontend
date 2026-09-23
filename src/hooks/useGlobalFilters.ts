import { useAppStore } from '@/store/useAppStore'
import type { GeoResumenFilters, ReporteGeoFilters } from '@/types'

// Filtros geográficos/proyecto/año compartidos por biomasa, COS, MOM e
// instalación de unidades de muestreo -no tienen gas/analizador/condicion_luz,
// esos campos solo existen en flujos (SubmuestraGEI)-. "incluirFecha=false"
// se usa en tendencia-instalacion, cuyo backend no acepta desde/hasta -su eje
// x ya es la fecha de instalación misma-.
export function useReporteFiltros(incluirFecha = true): ReporteGeoFilters {
  const proyectoId = useAppStore((s) => s.filters.proyectoId)
  const year = useAppStore((s) => s.filters.year)
  const region = useAppStore((s) => s.region)
  const departamento = useAppStore((s) => s.departamento)
  const municipio = useAppStore((s) => s.municipio)
  const vereda = useAppStore((s) => s.vereda)

  const filtros: ReporteGeoFilters = {}
  if (proyectoId != null) filtros.proyecto = proyectoId
  if (region) filtros.region = region.id
  if (departamento) filtros.departamento = departamento.id
  if (municipio) filtros.municipio = municipio.id
  if (vereda) filtros.vereda = vereda.id
  if (incluirFecha && year != null) {
    filtros.desde = `${year}-01-01`
    filtros.hasta = `${year}-12-31`
  }
  return filtros
}

// Mismos filtros que arriba, más gas/analizador/día-noche -solo aplican a
// flujos-, para consumidores de /api/geo/series/, /api/geo/resumen/ y
// /api/geo/resumen-categorico/ con categoria=flujos.
export function useFlujosFiltros(): GeoResumenFilters {
  const base = useReporteFiltros()
  const gas = useAppStore((s) => s.filters.gas)
  const flujosAnalizadorId = useAppStore((s) => s.flujosAnalizadorId)
  const flujosCondicionLuzId = useAppStore((s) => s.flujosCondicionLuzId)

  const filtros: GeoResumenFilters = { categoria: 'flujos', gas, ...base }
  if (flujosAnalizadorId != null) filtros.analizador = flujosAnalizadorId
  if (flujosCondicionLuzId != null) filtros.condicion_luz = String(flujosCondicionLuzId)
  return filtros
}
