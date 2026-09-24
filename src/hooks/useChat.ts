import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { ChatMessage, NivelAcceso } from '@/types'

let nextId = 0
const makeId = () => `msg-${++nextId}`

// Deben coincidir con lo que acepta el asistente (carga_documentos.py).
export const FORMATOS_DOCUMENTO = '.pdf,.docx,.xlsx,.csv,.txt,.md,.jpg,.jpeg,.png,.webp'
const MAX_MB_DOCUMENTO = 25
const NIVELES_CON_CARGA: NivelAcceso[] = ['reportador', 'admin']
const MIN_CARACTERES_DESCRIPCION = 15

const BIENVENIDA_RESPALDO =
  'Hola, soy el asistente de COLFLUX. Pregúntame por un lugar y un dato, o por un término que no conozcas.'
const PREGUNTA_DESCRIPCION =
  '¿Qué vas a subir? Cuéntame el tipo de archivo (entrevista, términos del diccionario, datos de flujos de gases, ' +
  'clima, suelo, biomasa o materia orgánica muerta, o una imagen) y de qué trata su contenido. ' +
  'Así puedo revisarlo mejor. Escribe «cancelar» si ya no quieres subir nada.'

// La subida es una pequeña conversación:
//   inactivo → (📎) describiendo → (la persona responde) listo → (📎 elige archivo) → inactivo
// Si a un archivo de datos le faltan campos obligatorios queda `pendiente`, y
// los mensajes siguientes se envían como respuestas hasta completar o cancelar.
type EstadoCarga = 'inactivo' | 'describiendo' | 'listo'

interface CargaPendiente {
  archivo: File
  complementos: string[]
}

const esCancelar = (texto: string) =>
  texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f.!]/g, '') === 'cancelar'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>('inactivo')
  const [descripcion, setDescripcion] = useState('')
  const [pendiente, setPendiente] = useState<CargaPendiente | null>(null)
  const token = useAuthStore((s) => s.token)
  const usuario = useAuthStore((s) => s.usuario)
  // Con sesión, el asistente recibe quién escribe y su token; sin sesión, cada
  // pestaña tiene su propio identificador para no compartir historial.
  const anonimo = useRef(`anonimo-${crypto.randomUUID()}`)
  const mutation = useMutation({
    mutationFn: (message: string) =>
      chatService.postChat(message, {
        usuario: usuario ? `usuario-${usuario.id}` : anonimo.current,
        token: token ?? undefined,
      }),
  })

  const agregar = useCallback((role: ChatMessage['role'], content: string, error = false) => {
    setMessages((prev) => [...prev, { id: makeId(), role, content, error }])
  }, [])

  // La presentación es el primer mensaje del chat.
  useEffect(() => {
    let vigente = true
    chatService
      .getBienvenida()
      .catch(() => BIENVENIDA_RESPALDO)
      .then((texto) => {
        if (vigente) setMessages((prev) => [{ id: makeId(), role: 'assistant', content: texto }, ...prev])
      })
    return () => {
      vigente = false
    }
  }, [])

  const reiniciarCarga = useCallback(() => {
    setEstadoCarga('inactivo')
    setDescripcion('')
    setPendiente(null)
  }, [])

  const enviarArchivo = useCallback(
    async (archivo: File, complementos: string[]) => {
      if (!token) return
      setSubiendo(true)
      try {
        const r = await chatService.postDocumento(archivo, token, descripcion, complementos)
        if (r.pendiente) setPendiente({ archivo, complementos })
        else reiniciarCarga()
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: 'assistant',
            content: r.mensaje,
            error: !r.aceptado && !r.pendiente,
            archivo: r.aceptado && r.archivo ? r.archivo : undefined,
          },
        ])
      } catch (e) {
        reiniciarCarga()
        agregar(
          'assistant',
          e instanceof TypeError || !(e instanceof Error)
            ? 'No se pudo contactar al asistente. Verifica tu conexión e intenta de nuevo.'
            : e.message,
          true
        )
      } finally {
        setSubiendo(false)
      }
    },
    [token, descripcion, agregar, reiniciarCarga]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || mutation.isPending || subiendo) return

      agregar('user', trimmed)

      if (token && (pendiente || estadoCarga === 'describiendo')) {
        if (esCancelar(trimmed)) {
          reiniciarCarga()
          agregar('assistant', 'Listo, cancelé la subida. No se guardó nada.')
          return
        }
        if (pendiente) {
          await enviarArchivo(pendiente.archivo, [...pendiente.complementos, trimmed])
          return
        }
        if (trimmed.length < MIN_CARACTERES_DESCRIPCION) {
          agregar('assistant', 'Cuéntame un poco más: qué tipo de archivo es y de qué trata.')
          return
        }
        setDescripcion(trimmed)
        setEstadoCarga('listo')
        agregar('assistant', 'Gracias. Ahora elige el archivo con el botón 📎 (PDF, Word, Excel, CSV, texto o imagen).')
        return
      }

      try {
        const { answer, sources } = await mutation.mutateAsync(trimmed)
        setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: answer, sources }])
      } catch {
        agregar('assistant', 'No se pudo contactar al asistente. Verifica tu conexión e intenta de nuevo.', true)
      }
    },
    [mutation, subiendo, token, pendiente, estadoCarga, agregar, enviarArchivo, reiniciarCarga]
  )

  // Primer toque del 📎: antes de elegir el archivo, el chat pregunta qué es.
  // El nivel se comprueba aquí solo para avisar; quien decide es el asistente,
  // que lo verifica con el backend.
  const pedirArchivo = useCallback(() => {
    if (!token || subiendo || mutation.isPending) return
    if (!usuario || !NIVELES_CON_CARGA.includes(usuario.nivel)) {
      agregar(
        'assistant',
        'Para subir archivos necesitas nivel reportador. Puedes solicitar ese nivel a un administrador de la plataforma.',
        true
      )
      return
    }
    setPendiente(null)
    setEstadoCarga('describiendo')
    agregar('assistant', PREGUNTA_DESCRIPCION)
  }, [token, usuario, subiendo, mutation.isPending, agregar])

  const uploadFile = useCallback(
    async (archivo: File) => {
      if (estadoCarga !== 'listo' || subiendo || mutation.isPending) return
      agregar('user', `📎 ${archivo.name}`)
      if (archivo.size > MAX_MB_DOCUMENTO * 1024 * 1024) {
        agregar('assistant', `El archivo supera el máximo de ${MAX_MB_DOCUMENTO} MB.`, true)
        return
      }
      await enviarArchivo(archivo, [])
    },
    [estadoCarga, subiendo, mutation.isPending, agregar, enviarArchivo]
  )

  return {
    messages,
    sendMessage,
    uploadFile,
    pedirArchivo,
    isSending: mutation.isPending || subiendo,
    // Sin sesión no hay subida en curso, aunque hubiera quedado a medias.
    puedeSubir: Boolean(token),
    puedeElegirArchivo: Boolean(token) && estadoCarga === 'listo' && !pendiente,
    placeholder: token && pendiente
      ? 'Responde los datos que faltan o escribe «cancelar»…'
      : token && estadoCarga === 'describiendo'
        ? 'Describe qué vas a subir o escribe «cancelar»…'
        : undefined,
  }
}
