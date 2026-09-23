import type {
  SitiosFeatureCollection,
  SitiosFilters,
  SerieResponse,
  SeriesFilters,
  GeoNivel,
  GeoResumenFeatureCollection,
  GeoResumenFilters,
  DimensionCategorica,
  ResumenCategoricoResponse,
  ResumenCategoricoFilters,
  Agrupacion,
  TendenciaInstalacionResponse,
  ReporteGeoFilters,
} from '@/types'

const GEO_API_BASE = import.meta.env.VITE_GEO_API_BASE_URL ?? 'http://localhost:8001/api/geo'

export const geoService = {
  getSitios: async (filters: SitiosFilters = {}): Promise<SitiosFeatureCollection> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null) params.set(k, String(v))
    })
    const query = params.toString()
    const url = `${GEO_API_BASE}/sitios/${query ? `?${query}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<SitiosFeatureCollection>
  },

  getResumen: async (
    nivel: GeoNivel,
    filters: GeoResumenFilters = {}
  ): Promise<GeoResumenFeatureCollection> => {
    const params = new URLSearchParams({ nivel })
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null) params.set(k, String(v))
    })
    const url = `${GEO_API_BASE}/resumen/?${params.toString()}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<GeoResumenFeatureCollection>
  },

  getSeries: async (filters: SeriesFilters = {}): Promise<SerieResponse> => {
    const params = new URLSearchParams(
      Object.entries(filters)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    )
    const query = params.toString()
    const url = `${GEO_API_BASE}/series/${query ? `?${query}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<SerieResponse>
  },

  getResumenCategorico: async (
    dimension: DimensionCategorica,
    filters: ResumenCategoricoFilters = {}
  ): Promise<ResumenCategoricoResponse> => {
    const params = new URLSearchParams({ dimension })
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null) params.set(k, String(v))
    })
    const url = `${GEO_API_BASE}/resumen-categorico/?${params.toString()}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<ResumenCategoricoResponse>
  },

  getTendenciaInstalacion: async (
    params: { agrupar?: Agrupacion } & Omit<ReporteGeoFilters, 'desde' | 'hasta'> = {}
  ): Promise<TendenciaInstalacionResponse> => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) search.set(k, String(v))
    })
    const query = search.toString()
    const url = `${GEO_API_BASE}/tendencia-instalacion/${query ? `?${query}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<TendenciaInstalacionResponse>
  },
}
