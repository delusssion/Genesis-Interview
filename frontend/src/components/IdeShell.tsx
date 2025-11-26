import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { checkCode, runCode } from '../shared/api/tasks'

type Language = 'typescript' | 'python' | 'go'

const languages: { id: Language; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
]

const defaultCode: Record<Language, string> = {
  typescript: `function firstUniqueChar(s: string): number {
  const counts = new Map<string, number>()
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  for (let i = 0; i < s.length; i++) if (counts.get(s[i]) === 1) return i
  return -1
}

console.log(firstUniqueChar("leetcode"))`,
  python: `def first_unique_char(s: str) -> int:
    counts = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1

print(first_unique_char("leetcode"))`,
  go: `package main

import "fmt"

func firstUniqueChar(s string) int {
  counts := make(map[rune]int)
  for _, ch := range s { counts[ch]++ }
  for i, ch := range s { if counts[ch] == 1 { return i } }
  return -1
}

func main() { fmt.Println(firstUniqueChar("leetcode")) }`,
}

type Props = {
  sessionId: number | null
  taskId: string | null
  language?: string
  onProgress?: (data: {
    sessionId: number
    state: string
    quality?: number | null
    testsPassed?: number | null
    testsTotal?: number | null
    feedback?: string
  }) => void
  onCodeChange?: (code: string) => void
}

type RunResult = {
  type: 'run' | 'check'
  success: boolean
  results?: { test: number; passed: boolean }[]
  details?: string | null
  stderr?: string | null
  hiddenFailed?: boolean
  timeout?: boolean
  limitExceeded?: boolean
}

export function IdeShell({
  sessionId,
  taskId,
  language: initialLang = 'typescript',
  onProgress,
  onCodeChange,
}: Props) {
  const [language, setLanguage] = useState<Language>(initialLang as Language)
  const [code, setCode] = useState(defaultCode['typescript'])
  const [output, setOutput] = useState<string>('Готов к запуску.')
  const [status, setStatus] = useState<'idle' | 'running' | 'checking'>('idle')
  const [duration, setDuration] = useState<number | null>(null)
  const [runResult, setRunResult] = useState<RunResult | null>(null)

  const storageKey = useMemo(() => `ide-draft-${language}`, [language])

  useEffect(() => {
    setLanguage(initialLang as Language)
  }, [initialLang])

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    setCode(saved || defaultCode[language])
  }, [language, storageKey])

  useEffect(() => {
    onCodeChange?.(code)
  }, [code, onCodeChange])

  const saveDraft = (next: string) => {
    setCode(next)
    onCodeChange?.(next)
    localStorage.setItem(storageKey, next)
  }

  const pushProgress = (data: Partial<RunResult> & { state: string }) => {
    if (!sessionId) return
    const testsPassed =
      data.results?.filter((r) => r.passed).length ??
      (data.hiddenFailed === false ? data.results?.length ?? null : null)
    const testsTotal = data.results?.length ?? null
    const quality = data.success ? (data.type === 'check' ? 95 : 80) : 50
    onProgress?.({
      sessionId,
      state: data.state,
      quality,
      testsPassed,
      testsTotal,
      feedback:
        data.details ||
        (data.success ? 'Тесты пройдены' : data.stderr || 'Есть ошибки, проверь вывод'),
    })
  }

  const handleRun = async () => {
    if (!sessionId || !taskId) {
      setOutput('Нужна сессия и задача для запуска')
      return
    }
    setStatus('running')
    setOutput('Выполняем код...')
    setDuration(null)
    try {
      const res = await runCode({
        session_id: sessionId,
        task_id: taskId,
        language,
        code,
      })
      setDuration(res.time_ms || null)
      setRunResult({
        type: 'run',
        success: res.success,
        results: res.results,
        details: res.details,
        stderr: res.details,
      })
      setOutput(res.results ? JSON.stringify(res.results, null, 2) : res.success ? 'ok' : 'Ошибка запуска')
      pushProgress({
        type: 'run',
        success: res.success,
        results: res.results,
        details: res.details,
        state: res.state || 'awaiting_solution',
      })
    } catch (e) {
      setOutput((e as Error).message)
    } finally {
      setStatus('idle')
    }
  }

  const handleCheck = async () => {
    if (!sessionId || !taskId) {
      setOutput('Нужна сессия и задача для проверки')
      return
    }
    setStatus('checking')
    setOutput('Гоняем тесты...')
    setDuration(null)
    try {
      const res = await checkCode({
        session_id: sessionId,
        task_id: taskId,
        language,
        code,
      })
      setDuration(res.time_ms || null)
      setRunResult({
        type: 'check',
        success: res.success,
        details: res.details,
        hiddenFailed: res.hidden_failed,
        timeout: res.timeout,
        limitExceeded: res.limit_exceeded,
      })
      setOutput(res.details || (res.success ? 'Скрытые тесты пройдены' : 'Ошибки в скрытых тестах'))
      pushProgress({
        type: 'check',
        success: res.success,
        details: res.details,
        hiddenFailed: res.hidden_failed,
        timeout: res.timeout,
        limitExceeded: res.limit_exceeded,
        state: res.state || 'feedback_ready',
      })
    } catch (e) {
      setOutput((e as Error).message)
    } finally {
      setStatus('idle')
    }
  }

  const statusLabel =
    status === 'running' ? 'Запуск' : status === 'checking' ? 'Проверка тестов' : 'Готов'

  return (
    <div className="panel grid-full">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Шаг 5 · IDE</p>
          <h2>Редактор и раннер</h2>
          <p className="muted">
            Выберите язык, редактируйте код, запускайте Run/Check. Используем backend runner
            (/tasks/run, /tasks/check).
          </p>
        </div>
        <div className="pill pill-ghost">{statusLabel}</div>
      </div>

      <div className="ide-toolbar">
        <div className="lang-picker">
          <label>Язык</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={status !== 'idle'}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <div className="actions">
          <button className="ghost-btn" type="button" onClick={handleRun} disabled={status !== 'idle'}>
            {status === 'running' ? 'Запуск...' : 'Run'}
          </button>
          <button className="cta" type="button" onClick={handleCheck} disabled={status !== 'idle'}>
            {status === 'checking' ? 'Тесты...' : 'Check'}
          </button>
        </div>
      </div>

      <div className="ide-body">
        <div className="editor">
          <Editor
            height="260px"
            language={language === 'typescript' ? 'typescript' : language}
            value={code}
            onChange={(value) => saveDraft(value || '')}
            options={{ minimap: { enabled: false }, readOnly: status !== 'idle', fontSize: 14 }}
          />
        </div>
        <div className="runner-output">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Вывод</p>
              {duration !== null && <p className="muted">Время: {duration} мс</p>}
            </div>
          </div>
          {runResult && (
            <div className="tests-grid">
              {runResult.results?.map((res) => (
                <div key={res.test} className="test-card">
                  <div className="test-top">
                    <span className="pill pill-ghost">Тест {res.test}</span>
                    <span className={`status ${res.passed ? 'status-passed' : 'status-failed'}`}>
                      {res.passed ? 'ok' : 'fail'}
                    </span>
                  </div>
                </div>
              ))}
              {runResult.type === 'check' && runResult.hiddenFailed !== undefined && (
                <div className="test-card">
                  <div className="test-top">
                    <span className="pill pill-ghost">Скрытые</span>
                    <span
                      className={`status ${
                        runResult.hiddenFailed ? 'status-failed' : 'status-passed'
                      }`}
                    >
                      {runResult.hiddenFailed ? 'fail' : 'ok'}
                    </span>
                  </div>
                  {runResult.limitExceeded && <p className="muted">Лимит ресурсов</p>}
                  {runResult.timeout && <p className="muted">Таймаут</p>}
                </div>
              )}
            </div>
          )}
          {runResult?.stderr && <p className="muted">stderr: {runResult.stderr}</p>}
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  )
}
