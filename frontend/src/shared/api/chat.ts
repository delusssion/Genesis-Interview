import { api } from './client'

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

export function createChatEventSource(
  sessionId: number,
  onEvent: (event: ChatEvent) => void,
): EventSource {
  const es = new EventSource(`${import.meta.env.VITE_API_URL}/chat/stream?session_id=${sessionId}`, {
    withCredentials: true,
  })

  es.addEventListener('typing', () => onEvent({ type: 'typing' }))
  es.addEventListener('heartbeat', () => onEvent({ type: 'heartbeat' }))
  es.addEventListener('delta', (evt) => {
    try {
      const data = JSON.parse((evt as MessageEvent).data)
      onEvent({ type: 'delta', delta: data.delta })
    } catch {
      onEvent({ type: 'error', error: 'Invalid delta event' })
    }
  })
  es.addEventListener('final', (evt) => {
    try {
      const data = JSON.parse((evt as MessageEvent).data)
      onEvent({ type: 'final', final: data.final })
    } catch {
      onEvent({ type: 'error', error: 'Invalid final event' })
    }
  })
  es.addEventListener('error', (evt) => {
    onEvent({ type: 'error', error: (evt as MessageEvent).data || 'SSE error' })
  })

  return es
}
