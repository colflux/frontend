import type { Responsable } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

export interface LoginResponse {
  token: string
  usuario: Responsable
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null)
  return typeof data?.error === 'string' ? data.error : fallback
}

export const authService = {
  login: async (correo: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<LoginResponse>
  },

  registro: async (nombre: string, correo: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/registro/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, password }),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<LoginResponse>
  },

  logout: async (token: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
    })
    if (!res.ok && res.status !== 204) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
  },

  me: async (token: string): Promise<Responsable> => {
    const res = await fetch(`${API_BASE}/auth/me/`, {
      headers: { Authorization: `Token ${token}` },
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<Responsable>
  },

  forgotPassword: async (correo: string): Promise<{ detail: string }> => {
    const res = await fetch(`${API_BASE}/auth/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo }),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<{ detail: string }>
  },

  resetPassword: async (token: string, password: string): Promise<{ detail: string }> => {
    const res = await fetch(`${API_BASE}/auth/reset-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    if (!res.ok) throw new Error(await parseErrorMessage(res, `Error ${res.status}`))
    return res.json() as Promise<{ detail: string }>
  },
}
