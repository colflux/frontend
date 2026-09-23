import type { Proyecto, ProyectoPayload } from '@/types'

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

export const proyectosService = {
  listProyectos: async (): Promise<Proyecto[]> => {
    const res = await fetch(`${API_BASE}/proyectos/`)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data : (data.results ?? [])
  },

  crearProyecto: async (token: string, payload: ProyectoPayload): Promise<Proyecto> => {
    const res = await fetch(`${API_BASE}/proyectos/crear/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<Proyecto>
  },

  actualizarProyecto: async (token: string, id: number, payload: ProyectoPayload): Promise<Proyecto> => {
    const res = await fetch(`${API_BASE}/proyectos/${id}/`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<Proyecto>
  },

  eliminarProyecto: async (token: string, id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/proyectos/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    })
    if (!res.ok && res.status !== 204) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
  },
}
