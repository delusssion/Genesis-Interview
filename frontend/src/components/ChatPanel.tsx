import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { connectChatStream, sendMessage, type ChatEvent } from '../shared/api/chat'

const createAssistantMessage = (id: string): ChatMessage => ({
  id,
  role: 'assistant',
  content: '',
  createdAt: new Date().toISOString(),
  status: 'streaming',
})

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  status: 'streaming' | 'final' | 'error'
}

type Props = {
  sessionId: number | null
  onFinish?: () => void
}

export function ChatPanel({ sessionId, onFinish }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error' | 'closed'
  >('disconnected')
  const stopRef = useRef<(() => void) | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const sessionRef = useRef<number | null>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleEvent = useCallback((event: ChatEvent) => {
    const extractMessage = (text?: string) => {
      if (!text) return ''
      // убираем <think> даже если поток ещё не закрылся
      let cleaned = text.replace(/<think[\s\S]*?(?:<\/think>|$)/gi, '')
      // убираем маркеры ```json и ``` чтобы не подсвечивать сырые данные
      cleaned = cleaned.replace(/```json?|```/gi, ' ')
      const fenced = cleaned.match(/```json\s*([\s\S]*?)```/i)
      if (fenced?.[1]) {
        try {
          const parsed = JSON.parse(fenced[1])
          if (parsed?.message) return String(parsed.message)
        } catch (_) {
          // ignore parse error, fallback below
        }
        return fenced[1].trim()
      }
      try {
        const parsed = JSON.parse(cleaned)
        if (parsed?.message) return String(parsed.message)
      } catch (_) {
        // ignore parse error, fallback below
      }
      const messageField = cleaned.match(/"message"\s*:\s*"([\s\S]*?)"/i)
      if (messageField?.[1]) return messageField[1].replace(/\s+/g, ' ').trim()
      const stripped = cleaned.replace(/[{}`]/g, ' ').replace(/\s+/g, ' ').trim()
      return stripped
    }

    if (event.type === 'heartbeat') return
    if (event.type === 'typing') {
      setMessages((prev) => {
        const hasStreaming = prev.some((msg) => msg.status === 'streaming')
        if (hasStreaming) return prev
        return [...prev, createAssistantMessage(`asst-${Date.now()}`)]
      })
      return
    }
    if (event.type === 'delta' || event.type === 'final' || event.type === 'error') {
      setMessages((prev) => {
        const next = [...prev]
        const idx = next.findIndex((msg) => msg.status === 'streaming')
        const targetIndex = idx !== -1 ? idx : next.length - 1
        if (targetIndex < 0) return next

        const current = next[targetIndex]
        if (event.type === 'delta') {
          const deltaClean = extractMessage(event.delta)
          if (!deltaClean) return next
          next[targetIndex] = {
            ...current,
            status: 'streaming',
            content: current.content ? `${current.content}${deltaClean}` : deltaClean,
          }
        } else if (event.type === 'final') {
          const finalClean = extractMessage(event.final)
          const fallback = (event.final || '')
            .replace(/<think[\s\S]*?(?:<\/think>|$)/gi, '')
            .replace(/```[\s\S]*?```/g, '')
            .trim()
          const finalText = finalClean && finalClean !== '{}' ? finalClean : fallback
          next[targetIndex] = {
            ...current,
            status: 'final',
            content: finalText,
          }
          setIsSending(false)
        } else {
          next[targetIndex] = {
            ...current,
            status: 'error',
            content: event.error,
          }
          setIsSending(false)
        }
        return next
      })
    }
    if (event.type === 'error') {
      setStatus('error')
      stopRef.current?.()
    }
  }, [])

  const startStream = useCallback(() => {
    if (!sessionRef.current) return
    stopRef.current?.()
    const stop = connectChatStream(
      sessionRef.current,
      handleEvent,
      (next) => setStatus(next === 'closed' ? 'disconnected' : next),
      { autoReconnect: false },
    )
    stopRef.current = stop
  }, [handleEvent])

  useEffect(() => {
    sessionRef.current = sessionId
    if (!sessionId) {
      stopRef.current?.()
      setStatus('disconnected')
      setMessages([])
      setIsSending(false)
      return
    }

    setIsSending(true)
    startStream()

    return () => {
      stopRef.current?.()
      setStatus('closed')
    }
  }, [sessionId, startStream])

  const handleSend = async (evt: FormEvent) => {
    evt.preventDefault()
    const text = draft.trim()
    if (!text || isSending || !sessionId) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      status: 'final',
    }

    setMessages((prev) => [...prev, userMessage])
    setDraft('')
    setIsSending(true)

    try {
      await sendMessage({ session_id: sessionId, message: text })
      startStream()
    } catch (e) {
      setIsSending(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: (e as Error).message,
          createdAt: new Date().toISOString(),
          status: 'error',
        },
      ])
    }
  }

  if (!sessionId) {
    return (
      <div className="panel grid-full chat-fullscreen">
        <div className="chat-header">
          <div>
            <div className="chat-brand">Genesis Interview</div>
            <p className="chat-subtitle">Чат с ИИ-интервьюером</p>
          </div>
        </div>
        <p className="muted">Сначала запусти интервью, чтобы подключить чат.</p>
      </div>
    )
  }

  return (
    <div className="panel grid-full chat-fullscreen">
      <div className="chat-header">
        <div>
          <div className="chat-brand">Genesis Interview</div>
          <p className="chat-subtitle">Чат с ИИ-интервьюером</p>
        </div>
        <div className="chat-actions">
          <button className="ghost-btn danger" type="button" onClick={onFinish}>
            Завершить интервью
          </button>
        </div>
      </div>

      <div className="chat-shell">
        <div className="chat-messages big" ref={listRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`bubble bubble-${msg.role}`}>
              <div className="bubble-meta">
                <span className="pill pill-ghost">{msg.role === 'assistant' ? 'Интервьюер' : 'Вы'}</span>
                <span className="muted">{new Date(msg.createdAt).toLocaleTimeString()}</span>
              </div>
              <p>
                {msg.status === 'streaming' && !msg.content ? <span className="typing-dots">...</span> : msg.content}
              </p>
            </div>
          ))}
        </div>

        <form className="chat-input" onSubmit={handleSend}>
          <div className="chat-input-row big">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Напишите ответ или задайте вопрос..."
              disabled={isSending}
            />
            <button className="cta" type="submit" disabled={!draft.trim() || isSending}>
              {isSending ? 'Ждём ответ...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
