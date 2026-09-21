const API_ROOT = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api').replace(/\/api\/?$/, '')

export interface HomeStats {
  sitios: number
  datos: number
  usuarios: number
  ultimaMedicion: string | null
}

export const statsService = {
  getHomeStats: async (): Promise<HomeStats> => {
    const res = await fetch(`${API_ROOT}/chart-data/`)
    if (!res.ok) throw new Error(`API error ${res.status}: chart-data`)
    const data = await res.json()
    return {
      sitios: data.total_sitios,
      datos: data.total_mediciones,
      usuarios: data.total_usuarios,
      ultimaMedicion: data.ultima_medicion,
    }
  },
}
