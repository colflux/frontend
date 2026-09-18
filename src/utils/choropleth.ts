import type { GeoResumenFeature, GeoResumenFeatureCollection, UltimaMedicionCO2 } from '@/types'

export type MetricField = 'promedio' | 'total_muestras'

export const METRIC_LABELS: Record<MetricField, string> = {
  promedio: 'Promedio',
  total_muestras: 'Total de muestras',
}

const COLOR_LOW = '#739E5B'
const COLOR_MID = '#F2B91B'
const COLOR_HIGH = '#DF5B26'
const COLOR_NO_DATA = '#94a3b8'

export function getMetricValues(
  features: GeoResumenFeature[],
  metric: MetricField
): number[] {
  return features
    .map((f) => f.properties[metric])
    .filter((v): v is number => v != null)
}

/** Expresión de color de maplibre: interpola low→mid→high sobre el rango de la métrica actual. */
export function buildFillColorExpression(metric: MetricField, min: number, max: number): unknown[] {
  const noDataCase = ['==', ['get', metric], null]

  if (min >= max) {
    return ['case', noDataCase, COLOR_NO_DATA, COLOR_MID]
  }

  const mid = (min + max) / 2
  return [
    'case',
    noDataCase,
    COLOR_NO_DATA,
    ['interpolate', ['linear'], ['get', metric], min, COLOR_LOW, mid, COLOR_MID, max, COLOR_HIGH],
  ]
}

function collectCoords(geometry: GeoResumenFeature['geometry'], out: number[][]) {
  if (!geometry) return
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring) => ring.forEach((c) => out.push(c)))
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly) => poly.forEach((ring) => ring.forEach((c) => out.push(c))))
  } else if (geometry.type === 'Point') {
    out.push(geometry.coordinates)
  }
}

/** Calcula el bounding box [[minLng, minLat], [maxLng, maxLat]] de una FeatureCollection de polígonos. */
export function computeBounds(
  fc: GeoResumenFeatureCollection | GeoResumenFeature
): [[number, number], [number, number]] | null {
  const coords: number[][] = []
  const features = 'features' in fc ? fc.features : [fc]
  features.forEach((f) => collectCoords(f.geometry, coords))
  if (coords.length === 0) return null

  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  })
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

/**
 * maplibre serializa las properties anidadas (objetos) del GeoJSON source a
 * JSON string al leerlas vía queryRenderedFeatures/eventos de mapa — hay que
 * parsearlas de vuelta antes de usarlas.
 */
export function parseUltimaMedicion(raw: unknown): UltimaMedicionCO2 | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as UltimaMedicionCO2
    } catch {
      return null
    }
  }
  return raw as UltimaMedicionCO2
}

export { COLOR_LOW, COLOR_MID, COLOR_HIGH, COLOR_NO_DATA }
