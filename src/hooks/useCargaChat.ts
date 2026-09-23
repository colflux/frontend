import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import type { ChatMessage } from '@/types'

let nextId = 0
const makeId = () => `carga-msg-${++nextId}`

// Igual que useChat, pero atado a la conversación de mapeo de una carga
// del Formulario web: fija el `usuario` (identificador de conversación en
// ia-functions) y reenvía el token real de la persona en cada turno, para
// que las tools de escritura (confirmar_mapeo_columnas) puedan actuar en
// su nombre. Ver personal/tasks/backlog/formulario-web-carga-datos-ia.md.
export function useCargaChat(cargaId: number, token: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const usuario = `formulario-web-carga-${cargaId}`
  const mutation = useMutation({
    mutationFn: (text: string) => chatService.postChat(text, { usuario, token }),
  })

  const sendMessage = useCallback(
    async (text: string, mostrarComoUsuario = true) => {
      const trimmed = text.trim()
      if (!trimmed || mutation.isPending) return

      if (mostrarComoUsuario) {
        setMessages((prev) => [...prev, { id: makeId(), role: 'user', content: trimmed }])
      }

      try {
        const { answer, sources } = await mutation.mutateAsync(trimmed)
        setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: answer, sources }])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: 'assistant',
            content: 'No se pudo contactar al asistente. Verifica tu conexión e intenta de nuevo.',
            error: true,
          },
        ])
      }
    },
    [mutation]
  )

  return { messages, sendMessage, isSending: mutation.isPending }
}
