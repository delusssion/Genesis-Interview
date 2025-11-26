import { api } from './client'

export type StartInterviewPayload = {
  track: 'frontend' | 'backend' | 'data' | 'ml'
  level: 'junior' | 'middle' | 'senior'
  preferred_language: 'typescript' | 'python' | 'go'
  user_id: string
  locale?: string
}

export type StartInterviewResponse = {
  success: boolean
  session_id?: number
}

export function startInterview(body: StartInterviewPayload) {
  return api.post<StartInterviewResponse>('/interview/start', body)
}
