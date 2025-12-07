import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { checkCode, runCode } from '../shared/api/tasks'
import { sendMessage } from '../shared/api/chat'

type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'java' | 'cpp' | 'csharp' | 'shell'

const languages: { id: Language; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'shell', label: 'Bash' },
]

const defaultCode: Record<Language, string> = {
  typescript: '',
  javascript: '',
  python: '',
  go: '',
  java: '',
  cpp: '',
  csharp: '',
  shell: '',
}

const sampleTests = [
  { title: 'Тест 1', input: '[1, 2, 3, 4]', expected: '6' },
  { title: 'Тест 2', input: '[1, 5, 3, 5]', expected: '0' },
]

type Props = {
  sessionId: number | null
  taskId: string | null
  language?: string
  theme?: 'light' | 'dark'
  onProgress?: (data: {
    sessionId: number
    state: string
    quality?: number | null
    testsPassed?: number | null
    testsTotal?: number | null
    feedback?: string
  }) => void
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
  theme = 'light',
  onProgress,
}: Props) {
  const [language, setLanguage] = useState<Language>(initialLang as Language)
  const [code, setCode] = useState(defaultCode['typescript'])
  const [output, setOutput] = useState<string>(
    'Песочница готова: пиши код и запускай тесты, как только интервьюер даст задачу.',
  )
  const [status, setStatus] = useState<'idle' | 'running' | 'checking'>('idle')
  const [duration, setDuration] = useState<number | null>(null)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [resultsView, setResultsView] = useState<string>('')

  const storageKey = useMemo(() => `ide-draft-${language}`, [language])

  useEffect(() => {
    setLanguage(initialLang as Language)
  }, [initialLang])

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    setCode(saved || defaultCode[language])
  }, [language, storageKey])

  const saveDraft = (next: string) => {
    setCode(next)
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
    if (!sessionId) {
      setOutput('Нужна активная сессия для запуска')
      return
    }
    setStatus('running')
    setOutput('Выполняем код...')
    setDuration(null)
    try {
      const res = await runCode({
        session_id: sessionId,
        task_id: taskId ?? 'adhoc',
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
      setResultsView(JSON.stringify(res.results ?? [], null, 2))
      const streams = [res.details, res.stdout, res.stderr].filter(Boolean).join('\n')
      setOutput(streams || 'Код выполнен')
      pushProgress({
        type: 'run',
        success: res.success,
        results: res.results,
        details: res.details || undefined,
        state: res.state || 'awaiting_solution',
      })
    } catch (e) {
      setOutput((e as Error).message)
    } finally {
      setStatus('idle')
    }
  }

  const handleCheck = async () => {
    if (!sessionId) {
      setOutput('Нужна активная сессия для отправки решения')
      return
    }
    setStatus('checking')
    setOutput('Гоняем тесты...')
    setDuration(null)
    try {
      const res = await checkCode({
        session_id: sessionId,
        task_id: taskId ?? 'adhoc',
        language,
        code,
      })
      setDuration(res.time_ms || null)
      setRunResult({
        type: 'check',
        success: res.success,
        results: res.results,
        details: res.details,
        hiddenFailed: res.hidden_failed,
        timeout: res.timeout,
        limitExceeded: res.limit_exceeded,
      })
      setResultsView(JSON.stringify(res.results ?? [], null, 2))
      setOutput(res.details || 'Результаты отправлены интервьюеру, ждём ответ.')
      // Отправляем итог в чат
      try {
        await sendMessage({
          session_id: sessionId,
          message: `Отправил решение по задаче ${taskId ?? 'adhoc'}:\n${res.details || ''}`,
        })
      } catch (_) {
        /* ignore */
      }
      pushProgress({
        type: 'check',
        success: res.success,
        details: res.details || undefined,
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

  return (
    <div className="panel runner-panel">
      <div className="runner-head">
        <div>
          <p className="eyebrow">Кодовая песочница</p>
          <h3>Раннер кода</h3>
        </div>
        <span className="muted small">
          {status === 'running' ? 'Запуск' : status === 'checking' ? 'Проверка тестов' : 'Готово'}
        </span>
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
            {status === 'running' ? 'Запуск...' : 'Запустить'}
          </button>
          <button className="cta" type="button" onClick={handleCheck} disabled={status !== 'idle'}>
            {status === 'checking' ? 'Отправка...' : 'Отправить решение'}
          </button>
        </div>
      </div>

      <div className="ide-body">
        <div className="editor">
          <Editor
            height="500px"
            language={language === 'typescript' ? 'typescript' : language}
            value={code}
            onChange={(value) => saveDraft(value || '')}
            theme={theme === 'dark' ? 'vs-dark' : 'vs'}
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
          <pre>{output || ' '}</pre>
          {resultsView && (
            <>
              <p className="eyebrow" style={{ marginTop: 8 }}>
                Детали тестов
              </p>
              <pre>{resultsView}</pre>
            </>
          )}
          {runResult && (
            <div className="visible-tests-card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Тесты</p>
                  <p className="muted">Результаты последних прогонов</p>
                </div>
              </div>
              <div className="tests-grid">
                {runResult.results?.map((res) => (
                  <div key={res.test} className="test-card">
                    <div className="test-top">
                      <span className="pill pill-ghost">Тест {res.test}</span>
                      <span className={`status ${res.passed ? 'status-passed' : 'status-failed'}`}>
                        {res.passed ? '✓' : '✕'}
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
                        {runResult.hiddenFailed ? '✕' : '✓'}
                      </span>
                    </div>
                    {runResult.limitExceeded && <p className="muted">Лимит ресурсов</p>}
                    {runResult.timeout && <p className="muted">Таймаут</p>}
                  </div>
                )}
              </div>
              <div className="sample-tests">
                {sampleTests.map((sample) => (
                  <p key={sample.title} className="muted">
                    {sample.title}: Входные данные: {sample.input}; Ожидаемый вывод: {sample.expected}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
