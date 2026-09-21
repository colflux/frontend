import type { MapeoCarga } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

export const mapeoService = {
  getMapeoCarga: async (fuenteId: number, cargaId: number): Promise<MapeoCarga> => {
    const url = `${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/mapeo/`
    const res = await fetch(url)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data as MapeoCarga
  },
}
