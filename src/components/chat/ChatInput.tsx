import { useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { FORMATOS_DOCUMENTO } from '@/hooks/useChat'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
  // Subida de archivos: sin sesión el 📎 queda deshabilitado. El primer toque
  // llama a onPedirArchivo (el chat pregunta qué se va a subir); cuando ya hay
  // descripción, abre el selector de archivos.
  onUpload?: (file: File) => void
  onPedirArchivo?: () => void
  puedeSubir?: boolean
  puedeElegirArchivo?: boolean
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Escribe tu pregunta…',
  onUpload,
  onPedirArchivo,
  puedeSubir = false,
  puedeElegirArchivo = false,
}: Props) {
  const [value, setValue] = useState('')
  const archivoRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClip = () => {
    if (puedeElegirArchivo) archivoRef.current?.click()
    else onPedirArchivo?.()
  }

  const handleArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (archivo && onUpload) onUpload(archivo)
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t border-border bg-panel">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50 max-h-32"
      />
      {onUpload && (
        <>
          <input
            ref={archivoRef}
            type="file"
            accept={FORMATOS_DOCUMENTO}
            onChange={handleArchivo}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleClip}
            disabled={disabled || !puedeSubir}
            className={`shrink-0 border w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              puedeElegirArchivo
                ? 'border-brand-teal text-brand-teal'
                : 'border-border text-fg-subtle hover:text-fg hover:border-brand-teal'
            }`}
            aria-label="Subir archivo"
            title={
              !puedeSubir
                ? 'Inicia sesión para subir archivos'
                : puedeElegirArchivo
                  ? 'Elegir el archivo'
                  : 'Subir archivo: entrevistas, términos, datos o imágenes'
            }
          >
            📎
          </button>
        </>
      )}
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="shrink-0 bg-brand-teal hover:bg-brand-teal-dark text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Enviar mensaje"
      >
        ➤
      </button>
    </div>
  )
}
