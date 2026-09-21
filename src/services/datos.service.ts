import type { DatosProyectoFilters, DatosProyectoResponse } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

export const datosService = {
  getDatosProyecto: async (
    proyectoId: number,
    { vista, sitio, filtros, offset, limite }: DatosProyectoFilters = {}
  ): Promise<DatosProyectoResponse> => {
    const params = new URLSearchParams()
    if (vista) params.set('vista', vista)
    if (sitio != null) params.set('sitio', String(sitio))
    if (filtros && Object.keys(filtros).length > 0) params.set('filtros', JSON.stringify(filtros))
    if (offset != null) params.set('offset', String(offset))
    if (limite != null) params.set('limite', String(limite))

    const query = params.toString()
    const url = `${API_BASE}/proyectos/${proyectoId}/datos/${query ? `?${query}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<DatosProyectoResponse>
  },

  getDatosCarga: async (
    fuenteId: number,
    cargaId: number,
    { vista, filtros, offset, limite }: DatosProyectoFilters = {}
  ): Promise<DatosProyectoResponse> => {
    const params = new URLSearchParams()
    if (vista) params.set('vista', vista)
    if (filtros && Object.keys(filtros).length > 0) params.set('filtros', JSON.stringify(filtros))
    if (offset != null) params.set('offset', String(offset))
    if (limite != null) params.set('limite', String(limite))

    const query = params.toString()
    const url = `${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/datos/${query ? `?${query}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<DatosProyectoResponse>
  },

  getExportarProyectoUrl: (proyectoId: number): string => `${API_BASE}/proyectos/${proyectoId}/exportar/`,

  getExportarCargaUrl: (fuenteId: number, cargaId: number): string =>
    `${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/exportar/`,
}
