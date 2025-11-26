import { env } from '../config/env'

type HttpMethod = 'GET' | 'POST'

const DEFAULT_RETRIES = 1
const RETRY_BASE_DELAY = 400

async function parseError(res: Response) {
  try {
    const data = await res.json()
    if (typeof data === 'string') return data
    if (data?.detail) return Array.isArray(data.detail) ? data.detail[0]?.msg ?? data.detail[0] : data.detail
    if (data?.message) return data.message
  } catch (_) {
    /* noop */
  }
  const text = await res.text()
  return text || `Request failed with status ${res.status}`
}

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const { method = 'GET', body } = options

  let lastError: unknown
  for (let attempt = 0; attempt <= DEFAULT_RETRIES; attempt++) {
    try {
      // Получаем токен из localStorage (или другого хранилища)
      let token = ''
      try {
        token = localStorage.getItem('access_token') || ''
      } catch {}

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(`${env.apiUrl}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!res.ok) {
        const msg = await parseError(res)
        if (res.status >= 500 && attempt < DEFAULT_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY * (attempt + 1)))
          continue
        }
        throw new Error(msg)
      }

      return (await res.json()) as T
    } catch (error) {
      lastError = error
      if (attempt < DEFAULT_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY * (attempt + 1)))
        continue
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown API error')
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
}
