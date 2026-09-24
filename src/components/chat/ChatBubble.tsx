import { BotonDescarga } from '@/components/chat/BotonDescarga'
import { ChatSources } from '@/components/chat/ChatSources'
import { VistaImagen } from '@/components/chat/VistaImagen'
import type { ChatMessage } from '@/types'
import { esImagenSubida } from '@/utils/archivosSubidos'

const MAX_IMAGENES = 4

interface Props {
  message: ChatMessage
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'
  // Imágenes subidas que menciona el mensaje: la recién guardada o las citadas
  // como fuente. Se muestran debajo del texto, sin abrir «fuentes».
  const imagenes = isUser
    ? []
    : [...new Set([message.archivo ?? '', ...(message.sources ?? []).map((s) => s.source)])]
        .filter(esImagenSubida)
        .slice(0, MAX_IMAGENES)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-brand-teal text-white rounded-br-sm'
              : message.error
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 rounded-bl-sm'
                : 'bg-panel border border-border text-fg rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        {imagenes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imagenes.map((archivo) => (
              <VistaImagen key={archivo} archivo={archivo} />
            ))}
          </div>
        )}
        {!isUser && message.archivo && (
          <div className="mt-1.5 text-xs">
            <BotonDescarga archivo={message.archivo} />
          </div>
        )}
        {!isUser && message.sources?.length ? <ChatSources sources={message.sources} /> : null}
      </div>
    </div>
  )
}
