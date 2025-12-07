import { useState } from 'react'
import { checkCode, fetchTask, runCode, type TaskResponse, type VisibleTest } from '../shared/api/tasks'

const statusLabels: Record<string, string> = {
  idle: 'ожидание',
  task_issued: 'задача получена',
  awaiting_solution: 'ожидаем решение',
  evaluating: 'проверяем',
  feedback_ready: 'фидбек готов',
}

type Props = {
  sessionId: number | null
  level: 'junior' | 'middle' | 'senior'
  language?: string
  onTaskChange: (taskId: string | null) => void
  onProgress?: (data: {
    sessionId: number
    state: string
    quality?: number | null
    testsPassed?: number | null
    testsTotal?: number | null
    feedback?: string
  }) => void
}

export function TaskPane({ sessionId, level, language = 'typescript', onTaskChange, onProgress }: Props) {
  const [task, setTask] = useState<TaskResponse['task'] | null>(null)
  const [state, setState] = useState<string>('idle')
  const [tests, setTests] = useState<VisibleTest[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [attempts, setAttempts] = useState(0)
  const [lastDuration, setLastDuration] = useState<number | null>(null)
  const [testsPassed, setTestsPassed] = useState<number | null>(null)
  const [testsTotal, setTestsTotal] = useState<number | null>(null)
  const [quality, setQuality] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string>('')

  const handleGetTask = async () => {
    if (!sessionId) {
      setMessage('Нужна активная сессия')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const res = await fetchTask(sessionId, level)
      if (res.success && res.task) {
        setTask(res.task)
        setTests(res.task.visible_tests as VisibleTest[])
        setState(res.state || 'task_issued')
        setAttempts(0)
        setLastDuration(null)
        setTestsPassed(null)
        setTestsTotal(res.task.visible_tests?.length ?? null)
        setQuality(null)
        setFeedback('')
        onTaskChange(res.task.task_id)
        onProgress?.({
          sessionId,
          state: res.state || 'task_issued',
          testsTotal: res.task.visible_tests?.length ?? null,
        })
      } else {
        setMessage('Не удалось получить задачу')
      }
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRun = async () => {
    if (!task || !sessionId) return
    const started = performance.now()
    setState('awaiting_solution')
    setMessage('Запуск...')
    try {
      const res = await runCode({
        session_id: sessionId,
        task_id: task.task_id,
        language,
        code: '', // код приходит из IDE
      })
      const duration = res.time_ms ?? Math.round(performance.now() - started)
      setLastDuration(duration)
      setAttempts((prev) => prev + 1)
      const passed = res.results?.filter((r) => r.passed).length ?? null
      const total = res.results?.length ?? testsTotal ?? null
      setTestsPassed(passed)
      setTestsTotal(total)
      setQuality(res.success ? 80 : 60)
      setFeedback(res.success ? 'Видимые тесты пройдены' : res.details || 'Ошибки на видимых тестах')
      setMessage(res.success ? 'Видимые тесты пройдены' : 'Тесты на видимых примерах не прошли')
      onProgress?.({
        sessionId,
        state: 'awaiting_solution',
        quality: res.success ? 80 : 60,
        testsPassed: passed,
        testsTotal: total,
        feedback: res.success
          ? 'Видимые тесты пройдены'
          : res.details || 'Ошибки на видимых тестах',
      })
    } catch (e) {
      setMessage((e as Error).message)
    }
  }

  const handleCheck = async () => {
    if (!task || !sessionId) return
    const started = performance.now()
    setState('evaluating')
    setMessage('Проверяем скрытые тесты...')
    try {
      const res = await checkCode({
        session_id: sessionId,
        task_id: task.task_id,
        language,
        code: '',
      })
      const duration = res.time_ms ?? Math.round(performance.now() - started)
      setLastDuration(duration)
      setAttempts((prev) => prev + 1)
      setQuality(res.success ? 95 : 50)
      setFeedback(res.details || (res.success ? 'Скрытые тесты пройдены' : 'Ошибки в скрытых тестах'))
      setState(res.state || 'feedback_ready')
      setMessage(res.success ? 'Скрытые тесты пройдены' : res.details || 'Ошибки в скрытых тестах')
      onProgress?.({
        sessionId,
        state: res.state || 'feedback_ready',
        quality: res.success ? 95 : 50,
        testsPassed,
        testsTotal,
        feedback: res.details || (res.success ? 'Скрытые тесты пройдены' : 'Ошибки в скрытых тестах'),
      })
    } catch (e) {
      setMessage((e as Error).message)
    }
  }

  const statusColor =
    state === 'feedback_ready'
      ? 'status-ready'
      : state === 'evaluating'
        ? 'status-in-progress'
        : state === 'idle'
          ? 'status-waiting'
          : 'status-ready'

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Шаг 4 · задача и тесты</p>
          <h2>Карточка задачи + стейт-машина</h2>
          <p className="muted">
            API: /tasks/next, /tasks/run, /tasks/check. Стейты: task_issued → awaiting_solution →
            evaluating → feedback_ready.
          </p>
        </div>
        <div className={`status ${statusColor}`}>{statusLabels[state]}</div>
      </div>

      <div className="task-actions">
        <button className="cta" type="button" onClick={handleGetTask} disabled={loading}>
          {task ? 'Обновить задачу' : 'Получить задачу'}
        </button>
        <button
          className="ghost-btn"
          type="button"
          onClick={handleRun}
          disabled={!task || state === 'evaluating' || !sessionId}
        >
          Сдать решение
        </button>
        <button
          className="ghost-btn"
          type="button"
          onClick={handleCheck}
          disabled={!task || state === 'evaluating' || !sessionId}
        >
          Проверить тесты
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <p className="muted">Стейт</p>
          <h4>{statusLabels[state] || state}</h4>
          {lastDuration !== null && <p className="muted">Последний прогон: {lastDuration} мс</p>}
        </div>
        <div className="metric-card">
          <p className="muted">Попытки</p>
          <h4>{attempts}</h4>
          <p className="muted">Run/Check за сессию</p>
        </div>
        <div className="metric-card">
          <p className="muted">Тесты</p>
          <h4>
            {testsPassed !== null && testsTotal !== null
              ? `${testsPassed}/${testsTotal}`
              : testsTotal ?? tests.length ?? 0}
          </h4>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width:
                  testsPassed !== null && testsTotal
                    ? `${Math.min(100, Math.round((testsPassed / testsTotal) * 100))}%`
                    : '12%',
              }}
            />
          </div>
        </div>
        <div className="metric-card">
          <p className="muted">Качество кода</p>
          <h4>{quality !== null ? `${quality}/100` : '-'}</h4>
          <p className="muted">Оценка LLM/бека (эвристика)</p>
        </div>
      </div>

      {task ? (
        <div className="task-card">
          <div className="task-meta">
            <span className="pill pill-ghost">#{task.task_id}</span>
            <span className="pill pill-ghost">{level}</span>
            <span className="pill pill-ghost">{language}</span>
          </div>
          <h3>{task.title}</h3>
          <p className="muted">{task.description}</p>
          {task.constraints && (
            <ul className="constraints">
              {task.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}

          <div className="visible-tests">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Видимые тесты</p>
                <p className="muted">
                  Показываем примеры. Скрытые тесты останутся на бек раннере.
                </p>
              </div>
            </div>
            <div className="tests-grid">
              {tests.map((test) => (
                <div key={JSON.stringify(test)} className="test-card">
                  <div className="test-top">
                    <span className="pill pill-ghost">Пример</span>
                  </div>
                  <p className="muted">Input: {JSON.stringify(test.input)}</p>
                  <p className="muted">Expected: {JSON.stringify(test.output)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="placeholder">
          <p className="muted">
            Нажми “Получить задачу”, чтобы увидеть описание, ограничения и видимые тесты. Требуется
            активная сессия.
          </p>
        </div>
      )}
      <div className="feedback-box">
        <p className="eyebrow">Feedback</p>
        <p className="muted">{feedback || 'Будет показан фидбек после проверки решений.'}</p>
      </div>
      {message && <p className="muted">{message}</p>}
    </div>
  )
}
