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
}

const systemMessage: ChatMessage = {
  id: 'sys',
  role: 'assistant',
  content:
    'Привет! Я ИИ-интервьюер. После старта сессии отправь первое сообщение или нажми "Начать".',
  createdAt: new Date().toISOString(),
  status: 'final',
}

export function ChatPanel({ sessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([systemMessage])
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
          next[targetIndex] = {
            ...current,
            status: 'streaming',
            content: current.content ? `${current.content}${event.delta}` : event.delta,
          }
        } else if (event.type === 'final') {
          next[targetIndex] = {
            ...current,
            status: 'final',
            content: event.final,
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
      setMessages([systemMessage])
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
      <div className="panel grid-full">
        <p className="muted">Сначала запусти интервью, чтобы подключить чат.</p>
      </div>
    )
  }

  return (
    <div className="panel grid-full">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Шаг 3 · чат с ИИ</p>
          <h2>Чат Scibox (SSE)</h2>
          <p className="muted">Сессия нужна для подключения к /chat/stream и /chat/send.</p>
        </div>
        <div className="pill pill-ghost">Статус: {status}</div>
      </div>

      <div className="chat-shell">
        <div className="chat-messages" ref={listRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`bubble bubble-${msg.role}`}>
              <div className="bubble-meta">
                <span className="pill pill-ghost">{msg.role === 'assistant' ? 'ИИ' : 'Вы'}</span>
                <span className="muted">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                <span className={`status status-${msg.status}`}>
                  {msg.status === 'streaming'
                    ? 'typing'
                    : msg.status === 'final'
                      ? 'final'
                      : 'error'}
                </span>
              </div>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>

        <form className="chat-input" onSubmit={handleSend}>
          <div className="chat-hint">
            Отправь текст — ИИ ответит частями (SSE). Напиши «error» для проверки обработки ошибок.
          </div>
          <div className="chat-input-row">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Опиши стек или спроси интервьюера..."
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
