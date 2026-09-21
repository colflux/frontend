import type { SolicitudNivel, SolicitudNivelPayload } from '@/types'

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

export const solicitudesNivelService = {
  listar: async (token: string): Promise<SolicitudNivel[]> => {
    const res = await fetch(`${API_BASE}/solicitudes-nivel/`, { headers: authHeaders(token) })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    const data = await res.json()
    return Array.isArray(data) ? data : (data.results ?? [])
  },

  crear: async (token: string, payload: SolicitudNivelPayload): Promise<SolicitudNivel> => {
    const res = await fetch(`${API_BASE}/solicitudes-nivel/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<SolicitudNivel>
  },

  resolver: async (
    token: string,
    id: number,
    estado: 'aprobada' | 'rechazada'
  ): Promise<SolicitudNivel> => {
    const res = await fetch(`${API_BASE}/solicitudes-nivel/${id}/`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ estado }),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<SolicitudNivel>
  },
}
