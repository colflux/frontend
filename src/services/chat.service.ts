import type { ChatResponse } from '@/types'

const CHAT_API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

interface PostChatOptions {
  usuario?: string
  // Token `Authorization: Token <token>` del backend Django — solo hace
  // falta cuando la conversación necesita tools que escriben en el backend
  // en nombre de la persona (ej. confirmar un mapeo de columnas). Nunca lo
  // ve el LLM, ia-functions lo reenvía solo a esas tools puntuales.
  token?: string
}

export const chatService = {
  postChat: async (message: string, options?: PostChatOptions): Promise<ChatResponse> => {
    const res = await fetch(`${CHAT_API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, usuario: options?.usuario, token: options?.token }),
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json() as Promise<ChatResponse>
  },

  postIngest: async (source: string, text: string): Promise<{ chunks_indexed: number }> => {
    const res = await fetch(`${CHAT_API_BASE}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, text }),
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json() as Promise<{ chunks_indexed: number }>
  },
}
