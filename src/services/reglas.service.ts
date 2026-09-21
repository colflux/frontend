import type { DetalleRegla, ReglaAutollenado } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data as T
}

export const reglasService = {
  listReglasAutollenado: async (): Promise<ReglaAutollenado[]> => {
    const data = await fetchJson<{ reglas: ReglaAutollenado[] }>(`${API_BASE}/reglas-autollenado/`)
    return data.reglas ?? []
  },

  getDetalleRegla: (codigo: string): Promise<DetalleRegla> =>
    fetchJson<DetalleRegla>(`${API_BASE}/reglas-autollenado/${encodeURIComponent(codigo)}/`),

  actualizarParametrosRegla: (codigo: string, parametros: Record<string, string>): Promise<{ parametros: Record<string, string> }> =>
    fetchJson(`${API_BASE}/reglas-autollenado/${encodeURIComponent(codigo)}/parametros/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parametros }),
    }),

  aplicarRegla: (codigo: string): Promise<{ aplicados: number }> =>
    fetchJson(`${API_BASE}/reglas-autollenado/${encodeURIComponent(codigo)}/aplicar/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),

  deshacerLoteRegla: (lote: string): Promise<{ deshechas: number }> =>
    fetchJson(`${API_BASE}/reglas-autollenado/lotes/${encodeURIComponent(lote)}/deshacer/`, {
      method: 'POST',
    }),
}
