import type { CargaDocumentoResponse, ChatResponse } from '@/types'

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

  // Presentación que el chat muestra al abrirse. Vive en el asistente
  // (bienvenida.py) para que el texto esté en un solo lugar.
  getBienvenida: async (): Promise<string> => {
    const res = await fetch(`${CHAT_API_BASE}/bienvenida`)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const { texto } = (await res.json()) as { texto: string }
    return texto
  },

  // Sube un archivo desde el chat. El asistente verifica la sesión contra el
  // backend (nivel reportador) y revisa que el contenido sea de COLFLUX y
  // coincida con la `descripcion` que dio la persona. Si a un archivo de datos
  // le faltan campos obligatorios, responde `pendiente`; se reenvía con las
  // respuestas en `complementos`. Los errores traen el mensaje listo para mostrar.
  postDocumento: async (
    archivo: File,
    token: string,
    descripcion: string,
    complementos: string[] = []
  ): Promise<CargaDocumentoResponse> => {
    const datos = new FormData()
    datos.append('archivo', archivo)
    datos.append('descripcion', descripcion)
    if (complementos.length) datos.append('complementos', complementos.join('\n'))
    const res = await fetch(`${CHAT_API_BASE}/documentos`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body: datos,
    })
    const cuerpo = await res.json().catch(() => null)
    if (!res.ok) {
      if (typeof cuerpo?.detail === 'string') throw new Error(cuerpo.detail)
      if (res.status === 413) throw new Error('El archivo supera el tamaño máximo permitido.')
      throw new Error(`No se pudo subir el archivo (error ${res.status}).`)
    }
    return cuerpo as CargaDocumentoResponse
  },

  // Enlace temporal (1 hora) para mostrar una imagen subida; no pide sesión.
  getEnlaceImagen: async (archivo: string): Promise<string> => {
    const res = await fetch(`${CHAT_API_BASE}/documentos/imagen?archivo=${encodeURIComponent(archivo)}`)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return ((await res.json()) as { url: string }).url
  },

  // Enlace temporal (1 hora) al original de un archivo subido. El asistente
  // solo lo entrega a reportadores y administradores.
  getEnlaceDescarga: async (archivo: string, token: string): Promise<string> => {
    const res = await fetch(`${CHAT_API_BASE}/documentos/descargar?archivo=${encodeURIComponent(archivo)}`, {
      headers: { Authorization: `Token ${token}` },
    })
    const cuerpo = await res.json().catch(() => null)
    if (!res.ok) throw new Error(typeof cuerpo?.detail === 'string' ? cuerpo.detail : 'No se pudo preparar la descarga.')
    return (cuerpo as { url: string }).url
  },
}
