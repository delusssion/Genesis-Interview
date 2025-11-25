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
}

export function TaskPane({ sessionId, level, language = 'typescript', onTaskChange }: Props) {
  const [task, setTask] = useState<TaskResponse['task'] | null>(null)
  const [state, setState] = useState<string>('idle')
  const [tests, setTests] = useState<VisibleTest[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

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
        onTaskChange(res.task.task_id)
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
    setState('awaiting_solution')
    setMessage('Запуск...')
    try {
      const res = await runCode({
        session_id: sessionId,
        task_id: task.task_id,
        language,
        code: '', // код приходит из IDE, здесь просто демонстрация
      })
      if (!res.success) setMessage('Тесты на видимых примерах не прошли')
      else setMessage('Видимые тесты пройдены')
    } catch (e) {
      setMessage((e as Error).message)
    }
  }

  const handleCheck = async () => {
    if (!task || !sessionId) return
    setState('evaluating')
    setMessage('Проверяем скрытые тесты...')
    try {
      const res = await checkCode({
        session_id: sessionId,
        task_id: task.task_id,
        language,
        code: '',
      })
      setState(res.state || 'feedback_ready')
      setMessage(res.success ? 'Скрытые тесты пройдены' : res.details || 'Ошибки в скрытых тестах')
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
      {message && <p className="muted">{message}</p>}
    </div>
  )
}
