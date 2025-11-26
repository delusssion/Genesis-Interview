import { api } from './client'
import { env } from '../config/env'

export type ChatSendPayload = {
  session_id: number
  message: string
}

export type ChatEvent =
  | { type: 'typing' }
  | { type: 'delta'; delta: string }
  | { type: 'final'; final: string }
  | { type: 'error'; error: string }
  | { type: 'heartbeat' }

export function sendMessage(body: ChatSendPayload) {
  return api.post<{ success: boolean }>('/chat/send', body)
}

type StreamStatus = 'connecting' | 'connected' | 'error' | 'closed'

export function connectChatStream(
  sessionId: number,
  onEvent: (event: ChatEvent) => void,
  onStatus?: (status: StreamStatus) => void,
) {
  let stopped = false
  let es: EventSource | null = null
  let attempt = 0
  const retryDelays = [0, 1000, 3000, 5000]

  const connect = () => {
    if (stopped) return
    onStatus?.('connecting')
    es = new EventSource(`${env.apiUrl}/chat/stream?session_id=${sessionId}`, {
      withCredentials: true,
    })

    es.addEventListener('open', () => {
      attempt = 0
      onStatus?.('connected')
    })
    es.addEventListener('typing', () => onEvent({ type: 'typing' }))
    es.addEventListener('heartbeat', () => onEvent({ type: 'heartbeat' }))
    es.addEventListener('delta', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        if (data?.delta) onEvent({ type: 'delta', delta: data.delta })
      } catch {
        onEvent({ type: 'error', error: 'Invalid delta event' })
      }
    })
    es.addEventListener('final', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        if (data?.final) onEvent({ type: 'final', final: data.final })
      } catch {
        onEvent({ type: 'error', error: 'Invalid final event' })
      }
    })
    es.addEventListener('error', (evt) => {
      onStatus?.('error')
      onEvent({ type: 'error', error: (evt as MessageEvent).data || 'SSE error' })
      es?.close()
      if (stopped) return
      const delay = retryDelays[Math.min(attempt, retryDelays.length - 1)]
      attempt += 1
      setTimeout(connect, delay)
    })
  }

  connect()

  return () => {
    stopped = true
    onStatus?.('closed')
    es?.close()
  }
}
