import { api } from './client'

export interface SciboxRequest {
  message: string
  conversation_history: { role: string; content: string }[]
  model?: string
}

export interface SciboxResponse {
  response: string
  model_used?: string
}

export const sendSciboxMessage = async (
  request: SciboxRequest,
): Promise<SciboxResponse> => {
  try {
    return await api.post<SciboxResponse>('/chat/scibox', request)
  } catch (err) {
    console.error('Ошибка при отправке запроса в Scibox:', err)
    throw new Error('Не удалось получить ответ от ИИ')
  }
}
