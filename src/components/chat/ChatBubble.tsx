import { BotonDescarga } from '@/components/chat/BotonDescarga'
import { ChatSources } from '@/components/chat/ChatSources'
import type { ChatMessage } from '@/types'

interface Props {
  message: ChatMessage
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'

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
