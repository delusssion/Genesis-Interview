type Phase = {
  id: string
  title: string
  description: string
  status: 'ready' | 'waiting' | 'todo'
}

const phases: Phase[] = [
  {
    id: 'task-issue',
    title: 'Выдача задачи',
    description: 'LLM подбирает задачу и видимые тесты под выбранный уровень',
    status: 'ready',
  },
  {
    id: 'solution',
    title: 'Получение решения',
    description: 'Кандидат пишет в IDE, отправляет на раннер, фиксируем метрики',
    status: 'waiting',
  },
  {
    id: 'evaluation',
    title: 'Оценка и адаптивность',
    description:
      'Результаты автотестов + анализ качества кода влияют на следующую задачу',
    status: 'todo',
  },
  {
    id: 'feedback',
    title: 'Отчет и обратная связь',
    description: 'Разбор решения, баллы, рекомендации, экспорт для HR',
    status: 'todo',
  },
]

const signals = [
  'Копипаста/DevTools: слушаем события окна',
  'Фокус/blur вкладки: фиксируем паузы',
  'История попыток и тайминги запуска',
]

export function InterviewStatus() {
  const progressPercent = 35

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Шаг 2 · поток интервью</p>
          <h2>Стейт-машина статусов</h2>
          <p className="muted">
            Синхронизируем фронт с беком: выдача задачи → решение → оценка →
            отчет. Пока работаем на моках, дальше подключим FastAPI/Scibox.
          </p>
        </div>
        <div className="progress">
          <div className="progress-label">Подготовка UI/LLM</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="phases">
        {phases.map((phase) => (
          <div key={phase.id} className="phase">
            <div className="phase-top">
              <span className={`status status-${phase.status}`}>
                {phase.status === 'ready'
                  ? 'готово'
                  : phase.status === 'waiting'
                    ? 'ожидание'
                    : 'в планах'}
              </span>
              <h3>{phase.title}</h3>
            </div>
            <p className="muted">{phase.description}</p>
          </div>
        ))}
      </div>

      <div className="signals">
        <div>
          <p className="eyebrow">Анти-чит сигналы</p>
          <p className="muted">
            UI-хуки отправляют события на бек: будем стучать в эндпоинт
            телеметрии, пока выводим план.
          </p>
        </div>
        <div className="signal-tags">
          {signals.map((signal) => (
            <span key={signal} className="pill pill-ghost">
              {signal}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
