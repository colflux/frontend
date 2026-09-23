import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatTypingIndicator } from '@/components/chat/ChatTypingIndicator'
import { ChatInput } from '@/components/chat/ChatInput'
import { useRolActual } from '@/hooks/useRolActual'
import { useCargaChat } from '@/hooks/useCargaChat'
import { useAuthStore } from '@/store/useAuthStore'
import { iaCargaService } from '@/services/iaCarga.service'
import type { IaCargaSubirResponse } from '@/types'

const EXTENSIONES_VALIDAS = ['.xlsx', '.xls', '.csv']

export function ReportarFormulario() {
  const { tieneNivel } = useRolActual()
  const token = useAuthStore((s) => s.token)

  const [archivo, setArchivo] = useState<File | null>(null)
  const [nombreFuente, setNombreFuente] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)
  const [carga, setCarga] = useState<IaCargaSubirResponse | null>(null)

  if (!tieneNivel('reportador')) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!archivo || !token) return

    const nombre = nombreFuente.trim() || archivo.name
    const extension = archivo.name.slice(archivo.name.lastIndexOf('.')).toLowerCase()
    if (!EXTENSIONES_VALIDAS.includes(extension)) {
      setErrorSubida('Formato no permitido. Solo .xlsx, .xls o .csv')
      return
    }

    setSubiendo(true)
    setErrorSubida(null)
    try {
      const resultado = await iaCargaService.subirArchivo(token, archivo, nombre)
      setCarga(resultado)
    } catch (err) {
      setErrorSubida(err instanceof Error ? err.message : 'No se pudo subir el archivo.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <div>
        <Link
          to="/reportar"
          className="text-xs font-semibold text-brand-teal dark:text-brand-teal-bright hover:underline"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold text-fg mt-2">Formulario web</h1>
        <p className="text-sm text-fg-muted mt-1">
          Sube un archivo de datos (.xlsx, .xls o .csv) y conversa con el asistente para mapear
          sus columnas al modelo de datos de COLFLUX.
        </p>
      </div>

      {!carga ? (
        <Card title="Subir archivo">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-fg-muted font-medium">Nombre de la fuente</label>
              <input
                type="text"
                value={nombreFuente}
                onChange={(e) => setNombreFuente(e.target.value)}
                placeholder="Ej. Datos IDEAM estación Chingaza"
                className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-fg-muted font-medium">Archivo</label>
              <input
                type="file"
                accept={EXTENSIONES_VALIDAS.join(',')}
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="text-sm text-fg-muted file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-brand-teal file:text-white file:text-xs file:font-semibold hover:file:bg-brand-teal-dark file:cursor-pointer cursor-pointer"
              />
            </div>

            {errorSubida && <p className="text-xs text-red-600 dark:text-red-400">{errorSubida}</p>}

            <button
              type="submit"
              disabled={!archivo || subiendo}
              className="bg-brand-teal hover:bg-brand-teal-dark text-white px-4 py-2.5 rounded-md font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subiendo ? 'Subiendo…' : 'Subir y proponer mapeo con IA'}
            </button>
          </form>
        </Card>
      ) : (
        <CargaChat carga={carga} token={token!} />
      )}
    </div>
  )
}

function CargaChat({ carga, token }: { carga: IaCargaSubirResponse; token: string }) {
  const { messages, sendMessage, isSending } = useCargaChat(carga.carga_id, token)
  const bottomRef = useRef<HTMLDivElement>(null)
  const yaPidioPropuesta = useRef(false)

  useEffect(() => {
    if (yaPidioPropuesta.current) return
    yaPidioPropuesta.current = true
    sendMessage(
      `Quiero mapear la carga_id ${carga.carga_id} del formulario web, ¿me ayudas a proponer el mapeo de columnas?`,
      false
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carga.carga_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  return (
    <Card title={`Mapeo de columnas — carga #${carga.carga_id}`}>
      <p className="text-xs text-fg-muted mb-3">
        {carga.total_filas} filas · {carga.columnas.length} columnas detectadas. El asistente
        propondrá a qué campo del modelo corresponde cada una — revisa la propuesta y confirma
        cuando estés de acuerdo.
      </p>

      <div className="h-96 overflow-y-auto flex flex-col gap-3 border border-border rounded-md p-3 bg-surface">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {isSending && <ChatTypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 -mx-4 -mb-4">
        <ChatInput onSend={sendMessage} disabled={isSending} />
      </div>
    </Card>
  )
}
