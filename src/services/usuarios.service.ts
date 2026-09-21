import type { Institucion, InstitucionPayload, Responsable, RolUsuario, UsuarioPayload } from '@/types'

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

export const usuariosService = {
  listUsuarios: async (): Promise<Responsable[]> => {
    const res = await fetch(`${API_BASE}/usuarios/`)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data : (data.results ?? [])
  },

  listInstituciones: async (): Promise<Institucion[]> => {
    const res = await fetch(`${API_BASE}/instituciones/`)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data : (data.results ?? [])
  },

  listRolesUsuario: async (): Promise<RolUsuario[]> => {
    const res = await fetch(`${API_BASE}/roles-usuario/`)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data : (data.results ?? [])
  },

  crearUsuario: async (token: string, payload: UsuarioPayload): Promise<Responsable> => {
    const res = await fetch(`${API_BASE}/usuarios/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<Responsable>
  },

  actualizarUsuario: async (token: string, id: number, payload: UsuarioPayload): Promise<Responsable> => {
    const res = await fetch(`${API_BASE}/usuarios/${id}/`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<Responsable>
  },

  eliminarUsuario: async (token: string, id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/usuarios/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    })
    if (!res.ok && res.status !== 204) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
  },

  crearInstitucion: async (payload: InstitucionPayload): Promise<Institucion> => {
    const res = await fetch(`${API_BASE}/instituciones/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<Institucion>
  },

  actualizarInstitucion: async (id: number, payload: InstitucionPayload): Promise<Institucion> => {
    const res = await fetch(`${API_BASE}/instituciones/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<Institucion>
  },

  eliminarInstitucion: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/instituciones/${id}/`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
  },
}
