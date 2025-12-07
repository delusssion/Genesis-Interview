export type Track = 'frontend' | 'backend' | 'data' | 'ml' | 'devops' | 'mobile'
export type ChatMessage = { from: 'interviewer' | 'candidate'; text: string; at: string }

export type InterviewResult = {
  sessionId: number
  track: Track
  level: 'junior' | 'middle' | 'senior'
  status: 'passed' | 'failed' | 'in-progress'
  score?: number | null
  updatedAt: string
  startedAt: string
  durationMinutes?: number
  testsPassed?: number | null
  testsTotal?: number | null
  feedback?: string
  chat?: ChatMessage[]
}
