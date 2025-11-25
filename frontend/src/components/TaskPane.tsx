import { useState } from 'react'
import {
  type TaskPayload,
  type TaskState,
  type VisibleTestCase,
  evaluateMockTask,
  fetchMockTask,
} from '../shared/api/taskMock'

const statusLabels: Record<TaskState, string> = {
  idle: 'ожидание',
  task_issued: 'задача получена',
  awaiting_solution: 'ожидаем решение',
  evaluating: 'проверяем',
  feedback_ready: 'фидбек готов',
}

export function TaskPane() {
  const [task, setTask] = useState<TaskPayload | null>(null)
  const [state, setState] = useState<TaskState>('idle')
  const [tests, setTests] = useState<VisibleTestCase[]>([])
  const [loading, setLoading] = useState(false)

  const handleGetTask = async () => {
    setLoading(true)
    const nextTask = await fetchMockTask()
    setTask(nextTask)
    setTests(nextTask.visibleTests)
    setState('task_issued')
    setLoading(false)
  }

  const handleSubmit = () => {
    if (!task) return
    setState('awaiting_solution')
  }

  const handleEvaluate = async () => {
    if (!task) return
    setState('evaluating')
    const result = await evaluateMockTask()
    setTests(result)
    setState('feedback_ready')
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
            Моки выдачи задачи и проверки тестов. Статусы: task_issued → awaiting_solution →
            evaluating → feedback_ready. Дальше подменим на API.
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
          onClick={handleSubmit}
          disabled={!task || state === 'evaluating'}
        >
          Сдать решение
        </button>
        <button
          className="ghost-btn"
          type="button"
          onClick={handleEvaluate}
          disabled={!task || state === 'evaluating'}
        >
          Проверить тесты
        </button>
      </div>

      {task ? (
        <div className="task-card">
          <div className="task-meta">
            <span className="pill pill-ghost">#{task.id}</span>
            <span className="pill pill-ghost">{task.level}</span>
            <span className="pill pill-ghost">{task.language}</span>
          </div>
          <h3>{task.title}</h3>
          <p className="muted">{task.description}</p>
          <ul className="constraints">
            {task.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

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
                <div key={test.id} className="test-card">
                  <div className="test-top">
                    <span className="pill pill-ghost">{test.name}</span>
                    <span className={`status status-${test.status}`}>{test.status}</span>
                  </div>
                  <p className="muted">Input: {test.input}</p>
                  <p className="muted">Expected: {test.expected}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="placeholder">
          <p className="muted">
            Нажми “Получить задачу”, чтобы увидеть описание, ограничения и видимые тесты.
          </p>
        </div>
      )}
    </div>
  )
}
