import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { chatService } from '@/services/chat.service'
import type { UbicacionDispositivo } from '@/services/chat.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { ChatMessage, NivelAcceso } from '@/types'

let nextId = 0
const makeId = () => `msg-${++nextId}`

// Deben coincidir con lo que acepta el asistente (carga_documentos.py).
export const FORMATOS_DOCUMENTO = '.pdf,.docx,.xlsx,.csv,.txt,.md,.jpg,.jpeg,.png,.webp'
const MAX_MB_DOCUMENTO = 25
const NIVELES_CON_CARGA: NivelAcceso[] = ['reportador', 'admin']

const BIENVENIDA_RESPALDO =
  'Hola, soy el asistente de COLFLUX. Pregúntame por un lugar y un dato, o por un término que no conozcas.'
const PREGUNTA_DESCRIPCION =
  '¿Qué vas a subir? Cuéntame el tipo de archivo (entrevista, términos del diccionario, datos de flujos de gases, ' +
  'clima, suelo, biomasa o materia orgánica muerta, o una imagen) y de qué trata su contenido. ' +
  'Así puedo revisarlo mejor. Escribe «cancelar» si ya no quieres subir nada.'
const PREGUNTA_LUGAR =
  '¿De dónde es? Escríbelo así: «Ecosistema - vereda - municipio - departamento», por ejemplo ' +
  '«Páramo de Guerrero - vereda Monquetiva - Guatavita - Cundinamarca». También sirven coordenadas, ' +
  'por ejemplo «4.9136, -73.7363».'

// La subida es una pequeña conversación:
//   inactivo → (📎) describiendo → ubicando → listo → (📎 elige archivo) → inactivo
// En cada paso el asistente revisa la respuesta y no se avanza hasta que sea válida.
// Si el archivo no era el descrito, se queda en `listo` para elegir otro.
// Si a un archivo de datos le faltan campos obligatorios queda `pendiente`, y
// los mensajes siguientes se envían como respuestas hasta completar o cancelar.
type EstadoCarga = 'inactivo' | 'describiendo' | 'ubicando' | 'listo'

interface CargaPendiente {
  archivo: File
  complementos: string[]
}

const sinTildes = (texto: string) =>
  texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f.!¡¿?«»"]/g, '')
const esPalabra = (texto: string, ...palabras: string[]) => palabras.includes(sinTildes(texto))
const esAqui = (texto: string) => esPalabra(texto, 'aqui', 'aca', 'mi ubicacion', 'ubicacion actual', 'donde estoy')

// Identificador de la pestaña para quien no inició sesión. Se pasa a useState
// como función para que se calcule una sola vez y no en cada render.
const nuevoIdAnonimo = () => `anonimo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const errorDeRed = (e: unknown) =>
  e instanceof TypeError || !(e instanceof Error)
    ? 'No se pudo contactar al asistente. Verifica tu conexión e intenta de nuevo.'
    : e.message

// La ubicación del dispositivo solo existe en páginas seguras (https o localhost).
function pedirUbicacion(): Promise<UbicacionDispositivo | null> {
  if (typeof window === 'undefined' || !window.isSecureContext || !navigator.geolocation) {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitud: p.coords.latitude, longitud: p.coords.longitude, precision: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  })
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>('inactivo')
  const [descripcion, setDescripcion] = useState('')
  const [lugar, setLugar] = useState('')
  const [pendiente, setPendiente] = useState<CargaPendiente | null>(null)
  const ubicacion = useRef<Promise<UbicacionDispositivo | null> | null>(null)
  const token = useAuthStore((s) => s.token)
  const usuario = useAuthStore((s) => s.usuario)
  // Con sesión, el asistente recibe quién escribe y su token; sin sesión, cada
  // pestaña tiene su propio identificador para no compartir historial.
  const [anonimo] = useState(nuevoIdAnonimo)
  const mutation = useMutation({
    mutationFn: (message: string) =>
      chatService.postChat(message, {
        usuario: usuario ? `usuario-${usuario.id}` : anonimo,
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
    setLugar('')
    setPendiente(null)
    ubicacion.current = null
  }, [])

  const enviarArchivo = useCallback(
    async (archivo: File, complementos: string[]) => {
      if (!token) return
      setSubiendo(true)
      try {
        const dispositivo = ubicacion.current ? await ubicacion.current : null
        const r = await chatService.postDocumento(archivo, token, descripcion, complementos, lugar, dispositivo)
        if (r.pendiente) setPendiente({ archivo, complementos })
        else if (r.reintentar) setPendiente(null) // sigue en `listo`: puede elegir otro archivo
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
        agregar('assistant', errorDeRed(e), true)
      } finally {
        setSubiendo(false)
      }
    },
    [token, descripcion, lugar, agregar, reiniciarCarga]
  )

  // Respuestas de la persona mientras prepara una subida. Devuelve true si el
  // mensaje era parte de la subida (y no una pregunta para el asistente).
  const responderCarga = useCallback(
    async (texto: string): Promise<boolean> => {
      if (!token || (estadoCarga === 'inactivo' && !pendiente)) return false
      if (esPalabra(texto, 'cancelar')) {
        reiniciarCarga()
        agregar('assistant', 'Listo, cancelé la subida. No se guardó nada.')
        return true
      }
      if (pendiente) {
        await enviarArchivo(pendiente.archivo, [...pendiente.complementos, texto])
        return true
      }
      if (estadoCarga === 'listo') {
        if (esPalabra(texto, 'describir')) {
          setEstadoCarga('describiendo')
          agregar('assistant', PREGUNTA_DESCRIPCION)
          return true
        }
        if (esPalabra(texto, 'lugar')) {
          setEstadoCarga('ubicando')
          agregar('assistant', PREGUNTA_LUGAR)
          return true
        }
        return false // en `listo` se puede seguir conversando con el asistente
      }
      setSubiendo(true)
      try {
        if (estadoCarga === 'describiendo') {
          const r = await chatService.postDescripcion(texto, token)
          if (!r.aceptado) {
            agregar('assistant', r.mensaje, true)
            return true
          }
          setDescripcion(texto)
          if (lugar) {
            setEstadoCarga('listo')
            agregar('assistant', `Uso el mismo lugar de antes. Elige el archivo con 📎, o escribe «lugar» si es de otro sitio.`)
          } else {
            setEstadoCarga('ubicando')
            const gps = ubicacion.current ? await ubicacion.current : null
            agregar(
              'assistant',
              PREGUNTA_LUGAR +
                (gps
                  ? ` Tengo la ubicación de tu dispositivo (±${Math.round(gps.precision ?? 0)} m): si el archivo es de donde estás ahora, escribe «aquí».`
                  : '')
            )
          }
          return true
        }
        // ubicando
        let textoLugar = texto
        if (esAqui(texto)) {
          const gps = ubicacion.current ? await ubicacion.current : null
          if (!gps) {
            agregar('assistant', 'No tengo la ubicación de tu dispositivo. ' + PREGUNTA_LUGAR, true)
            return true
          }
          textoLugar = `${gps.latitud.toFixed(6)}, ${gps.longitud.toFixed(6)}`
        }
        const r = await chatService.postLugar(textoLugar, token)
        if (!r.aceptado) {
          agregar('assistant', r.mensaje, true)
          return true
        }
        setLugar(textoLugar)
        setEstadoCarga('listo')
        agregar('assistant', `${r.mensaje} Ahora elige el archivo con el botón 📎 (PDF, Word, Excel, CSV, texto o imagen).`)
        return true
      } catch (e) {
        agregar('assistant', errorDeRed(e), true)
        return true
      } finally {
        setSubiendo(false)
      }
    },
    [token, estadoCarga, pendiente, lugar, agregar, enviarArchivo, reiniciarCarga]
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || mutation.isPending || subiendo) return

      agregar('user', trimmed)
      if (await responderCarga(trimmed)) return

      try {
        const { answer, sources, descargas } = await mutation.mutateAsync(trimmed)
        setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: answer, sources, descargas }])
      } catch {
        agregar('assistant', 'No se pudo contactar al asistente. Verifica tu conexión e intenta de nuevo.', true)
      }
    },
    [mutation, subiendo, agregar, responderCarga]
  )

  // Primer toque del 📎: antes de elegir el archivo, el chat pregunta qué es y
  // de dónde. La ubicación del dispositivo se pide aquí (el navegador muestra su
  // propio permiso) y se espera recién al subir. El nivel se comprueba aquí solo
  // para avisar; quien decide es el asistente, que lo verifica con el backend.
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
    ubicacion.current = pedirUbicacion()
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
    placeholder: !token
      ? undefined
      : pendiente
        ? 'Responde los datos que faltan o escribe «cancelar»…'
        : estadoCarga === 'describiendo'
          ? 'Describe qué vas a subir o escribe «cancelar»…'
          : estadoCarga === 'ubicando'
            ? 'Ecosistema - vereda - municipio - departamento, o coordenadas…'
            : undefined,
  }
}
