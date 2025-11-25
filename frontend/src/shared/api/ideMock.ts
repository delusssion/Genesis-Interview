export type Language = 'typescript' | 'python' | 'go'

export type RunResult = {
  status: 'ok' | 'failed'
  stdout: string
  stderr?: string
  durationMs: number
}

export const languages: { id: Language; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
]

export function runMock(code: string, language: Language): Promise<RunResult> {
  const hasError = code.toLowerCase().includes('error')

  return new Promise((resolve) => {
    setTimeout(() => {
      if (hasError) {
        resolve({
          status: 'failed',
          stdout: '',
          stderr: 'Mock error: runtime exception on line 3',
          durationMs: 180,
        })
      } else {
        resolve({
          status: 'ok',
          stdout: `Executed ${language} code. Output preview:\n${code.slice(0, 80)}...`,
          durationMs: 120,
        })
      }
    }, 450)
  })
}

export function checkMock(code: string): Promise<RunResult> {
  const hasEdgeCase = code.toLowerCase().includes('todo')

  return new Promise((resolve) => {
    setTimeout(() => {
      if (hasEdgeCase) {
        resolve({
          status: 'failed',
          stdout: '',
          stderr: '1/5 tests failed: edge case with empty input not handled',
          durationMs: 320,
        })
      } else {
        resolve({
          status: 'ok',
          stdout: 'All visible tests passed. Hidden tests pending on backend runner.',
          durationMs: 260,
        })
      }
    }, 520)
  })
}
