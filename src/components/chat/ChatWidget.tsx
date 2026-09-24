import { useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatTypingIndicator } from '@/components/chat/ChatTypingIndicator'
import { ChatInput } from '@/components/chat/ChatInput'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const {
    messages,
    sendMessage,
    uploadFile,
    pedirArchivo,
    isSending,
    puedeSubir,
    puedeElegirArchivo,
    placeholder,
  } = useChat()
  const ultimoRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mientras el asistente escribe se muestra el indicador al final; cuando
  // llega un mensaje, se muestra desde su comienzo para que las respuestas
  // largas (como la bienvenida) no aparezcan cortadas a la mitad.
  useEffect(() => {
    if (!open) return
    if (isSending) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    else ultimoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [messages, isSending, open])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir chat"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-brand-teal hover:bg-brand-teal-dark text-white shadow-md flex items-center justify-center text-2xl transition-colors"
      >
        💬
      </button>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[32rem] max-h-[calc(100vh-6rem)] bg-panel border border-border rounded-2xl shadow-lg flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between bg-brand-teal text-white">
        <div>
          <h2 className="text-sm font-bold leading-none">Asistente COLFLUX</h2>
          <p className="text-xs text-white/80 mt-1">Pregunta sobre los datos de la plataforma</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Minimizar chat"
          className="text-white/80 hover:text-white text-lg leading-none px-1"
        >
          −
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={m.id} ref={i === messages.length - 1 ? ultimoRef : undefined} className="scroll-mt-3">
            <ChatBubble message={m} />
          </div>
        ))}
        {isSending && <ChatTypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        disabled={isSending}
        placeholder={placeholder}
        onUpload={uploadFile}
        onPedirArchivo={pedirArchivo}
        puedeSubir={puedeSubir}
        puedeElegirArchivo={puedeElegirArchivo}
      />
    </div>
  )
}
