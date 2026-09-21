import type { Responsable } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

export const responsablesService = {
  listResponsables: async (): Promise<Responsable[]> => {
    const url = `${API_BASE}/responsables/`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    const data = await res.json()
    return Array.isArray(data) ? data : (data.results ?? [])
  },
}
