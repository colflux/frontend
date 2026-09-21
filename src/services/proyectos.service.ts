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

export const proyectosService = {
  crearProyecto: async (payload: ProyectoPayload): Promise<Proyecto> => {
    const res = await fetch(`${API_BASE}/proyectos/crear/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<Proyecto>
  },
}
