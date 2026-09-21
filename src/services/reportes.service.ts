import type {
  DimensionBiomasa,
  BiomasaTaxonResponse,
  BiomasaProduccionResponse,
  CosProfundidadResponse,
  Agrupacion,
  MomTendenciaResponse,
} from '@/types'

// Relativa por defecto: en producción nginx enruta /api/ al backend en el
// mismo origen. En desarrollo (docker-compose --profile dev), el servicio
// "dev" ya pasa VITE_REPORTES_API_BASE_URL absoluta (localhost:8001) por su
// propio environment:, así que este fallback nunca se usa ahí.
const REPORTES_API_BASE = import.meta.env.VITE_REPORTES_API_BASE_URL ?? '/api/reportes'

export const reportesService = {
  getBiomasaPorTaxon: async (
    dimension: DimensionBiomasa = 'familia'
  ): Promise<BiomasaTaxonResponse> => {
    const url = `${REPORTES_API_BASE}/biomasa/?dimension=${dimension}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<BiomasaTaxonResponse>
  },

  getBiomasaProduccion: async (
    params: { proyecto?: number } = {}
  ): Promise<BiomasaProduccionResponse> => {
    const search = new URLSearchParams()
    if (params.proyecto != null) search.set('proyecto', String(params.proyecto))
    const query = search.toString()
    const url = `${REPORTES_API_BASE}/biomasa/produccion/${query ? `?${query}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<BiomasaProduccionResponse>
  },

  getCosPorProfundidad: async (
    params: { proyecto?: number } = {}
  ): Promise<CosProfundidadResponse> => {
    const search = new URLSearchParams()
    if (params.proyecto != null) search.set('proyecto', String(params.proyecto))
    const query = search.toString()
    const url = `${REPORTES_API_BASE}/cos/${query ? `?${query}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<CosProfundidadResponse>
  },

  getMomTendencia: async (
    params: { agrupar?: Agrupacion; proyecto?: number } = {}
  ): Promise<MomTendenciaResponse> => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) search.set(k, String(v))
    })
    const query = search.toString()
    const url = `${REPORTES_API_BASE}/mom/${query ? `?${query}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<MomTendenciaResponse>
  },
}
