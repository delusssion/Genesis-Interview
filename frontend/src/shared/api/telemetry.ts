import { api } from './client'

export type AntiCheatEvent = {
  type:
    | 'copy'
    | 'paste'
    | 'blur'
    | 'focus'
    | 'visibility-hidden'
    | 'visibility-visible'
    | 'devtools'
  at: string
  meta?: string
}

export function sendAnticheat(session_id: number, events: AntiCheatEvent[]) {
  return api.post<{ success: boolean; received: number }>('/telemetry/anticheat', {
    session_id,
    events,
  })
}
