const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const env = {
  apiUrl,
  isApiConfigured: Boolean(import.meta.env.VITE_API_URL),
}
