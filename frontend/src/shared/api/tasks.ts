import { api } from './client'

export type VisibleTest = {
  input: unknown
  output: unknown
}

export type TaskResponse = {
  success: boolean
  task?: {
    task_id: string
    title: string
    description: string
    visible_tests: VisibleTest[]
    constraints?: string[]
  }
  state?: string
  session_id?: number
}

export type RunResponse = {
  success: boolean
  task_id: string
  results?: { test: number; passed: boolean; input?: unknown; expected?: unknown; got?: unknown; error?: string; details?: string }[]
  time_ms?: number
  state?: string
  hidden_failed?: boolean
  details?: string | null
  timeout?: boolean
  limit_exceeded?: boolean
  stdout?: string
  stderr?: string
}

export function fetchTask(session_id: number, level: 'junior' | 'middle' | 'senior') {
  return api.post<TaskResponse>('/tasks/next', { session_id, level })
}

export function runCode(body: { session_id: number; task_id: string; language: string; code: string }) {
  return api.post<RunResponse>('/tasks/run', body)
}

export function checkCode(body: { session_id: number; task_id: string; language: string; code: string }) {
  return api.post<RunResponse>('/tasks/check', body)
}
