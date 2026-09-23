import type { FuenteDatos, FuenteDatosPayload, FuentesDropdownResponse } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null)
  if (!data) return fallback
  if (typeof data.error === 'string') return data.error
  const firstValue = Object.values(data)[0]
  if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0]
  if (typeof firstValue === 'string') return firstValue
  return fallback
}

function authHeaders(token: string) {
  return { Authorization: `Token ${token}`, 'Content-Type': 'application/json' }
}

export const fuentesService = {
  listFuentesDropdown: async (proyectoId?: number): Promise<FuentesDropdownResponse> => {
    const url = proyectoId != null
      ? `${API_BASE}/fuentes-datos/?proyecto=${encodeURIComponent(proyectoId)}`
      : `${API_BASE}/fuentes-datos/`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
    return res.json() as Promise<FuentesDropdownResponse>
  },

  createFuente: async (token: string, payload: FuenteDatosPayload): Promise<FuenteDatos> => {
    const res = await fetch(`${API_BASE}/fuentes-datos-crud/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<FuenteDatos>
  },

  updateFuente: async (token: string, id: number, payload: FuenteDatosPayload): Promise<FuenteDatos> => {
    const res = await fetch(`${API_BASE}/fuentes-datos-crud/${id}/`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<FuenteDatos>
  },

  eliminarFuente: async (token: string, id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/fuentes-datos-crud/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    })
    if (!res.ok && res.status !== 204) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
  },

  uploadArchivoFuente: async (token: string, fuenteId: number, archivo: File): Promise<{ url: string }> => {
    const fd = new FormData()
    fd.append('archivo', archivo)
    const res = await fetch(`${API_BASE}/fuentes-datos/${fuenteId}/archivo/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body: fd,
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<{ url: string }>
  },
}
