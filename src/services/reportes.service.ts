import type {
  DimensionBiomasa,
  BiomasaTaxonResponse,
  BiomasaProduccionResponse,
  CosProfundidadResponse,
  Agrupacion,
  MomTendenciaResponse,
  ReporteGeoFilters,
} from '@/types'

// Relativa por defecto: en producción nginx enruta /api/ al backend en el
// mismo origen. En desarrollo (docker-compose --profile dev), el servicio
// "dev" ya pasa VITE_REPORTES_API_BASE_URL absoluta (localhost:8001) por su
// propio environment:, así que este fallback nunca se usa ahí.
const REPORTES_API_BASE = import.meta.env.VITE_REPORTES_API_BASE_URL ?? '/api/reportes'

function buildQuery(params: object): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) search.set(k, String(v))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const reportesService = {
  getBiomasaPorTaxon: async (
    dimension: DimensionBiomasa = 'familia',
    filters: ReporteGeoFilters = {}
  ): Promise<BiomasaTaxonResponse> => {
    const url = `${REPORTES_API_BASE}/biomasa/${buildQuery({ dimension, ...filters })}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<BiomasaTaxonResponse>
  },

  getBiomasaProduccion: async (filters: ReporteGeoFilters = {}): Promise<BiomasaProduccionResponse> => {
    const url = `${REPORTES_API_BASE}/biomasa/produccion/${buildQuery(filters)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<BiomasaProduccionResponse>
  },

  getCosPorProfundidad: async (filters: ReporteGeoFilters = {}): Promise<CosProfundidadResponse> => {
    const url = `${REPORTES_API_BASE}/cos/${buildQuery(filters)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<CosProfundidadResponse>
  },

  getMomTendencia: async (
    params: { agrupar?: Agrupacion } & ReporteGeoFilters = {}
  ): Promise<MomTendenciaResponse> => {
    const url = `${REPORTES_API_BASE}/mom/${buildQuery(params)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<MomTendenciaResponse>
  },
}
