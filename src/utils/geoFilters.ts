import type { CategoriaDato, FilterState, GeoResumenFilters, Metodologia } from '@/types'

// "general" y "flujos" son la misma categoría de dato para el mapa -la
// diferencia entre esas dos metodologías es solo el recuadro de filtros que
// se muestra, no qué trae /api/geo/sitios//resumen-.
export function metodologiaToCategoria(metodologia: Metodologia): CategoriaDato {
  return metodologia === 'biomasa' || metodologia === 'cos' ? metodologia : 'flujos'
}

// El selector "Año" del panel de filtros se traduce al rango desde/hasta que
// espera /api/geo/resumen/ (no hay un date-range picker separado). El gas,
// analizador y día/noche solo aplican cuando la categoría es "flujos"
// -biomasa/cos no los soportan-.
export function buildGeoResumenBaseFilters(
  filters: FilterState,
  metodologia: Metodologia,
  flujosFiltros?: { analizadorId?: number | string | null; condicionLuzId?: number | string | null }
): GeoResumenFilters {
  const categoria = metodologiaToCategoria(metodologia)
  const f: GeoResumenFilters = { categoria }
  if (categoria === 'flujos') {
    f.gas = filters.gas
    if (flujosFiltros?.analizadorId != null) f.analizador = flujosFiltros.analizadorId
    if (flujosFiltros?.condicionLuzId != null) f.condicion_luz = String(flujosFiltros.condicionLuzId)
  }
  if (filters.year != null) {
    f.desde = `${filters.year}-01-01`
    f.hasta = `${filters.year}-12-31`
  }
  if (filters.proyectoId != null) f.proyecto = filters.proyectoId
  return f
}
