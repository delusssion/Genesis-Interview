type Track = {
  id: string
  title: string
  stack: string
  focus: string
  status: 'ready' | 'in-progress' | 'todo'
}

const tracks: Track[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    stack: 'React · Vite · TypeScript · Monaco IDE',
    focus: 'UI/UX, чат, код-раннер, анти-чит события',
    status: 'in-progress',
  },
  {
    id: 'backend',
    title: 'Backend',
    stack: 'FastAPI · Scibox · Docker runner',
    focus: 'Задачи, адаптивность, изоляция кода, метрики',
    status: 'todo',
  },
  {
    id: 'ml-llm',
    title: 'LLM/Prompts',
    stack: 'Scibox LLM · state machine · safety',
    focus: 'Генерация задач, оценка решений, фолбэки',
    status: 'todo',
  },
]

const levels = ['Junior', 'Middle', 'Senior']

export function TrackSelection() {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Шаг 1 · выбор направления и уровня</p>
          <h2>Собеседование с адаптивными задачами</h2>
          <p className="muted">
            Выберите направление, отметьте уровень, далее получаем задачу от
            Scibox, отслеживаем прогресс и анти-чит.
          </p>
        </div>
        <button className="cta" type="button">
          Начать мок-интервью
        </button>
      </div>

      <div className="levels">
        {levels.map((level) => (
          <div key={level} className="level-pill">
            {level}
          </div>
        ))}
      </div>

      <div className="tracks-grid">
        {tracks.map((track) => (
          <div key={track.id} className="track-card">
            <div className="track-header">
              <span className={`status status-${track.status}`}>
                {track.status === 'ready'
                  ? 'готово'
                  : track.status === 'in-progress'
                    ? 'в работе'
                    : 'в планах'}
              </span>
              <span className="track-id">#{track.id}</span>
            </div>
            <h3>{track.title}</h3>
            <p className="muted">{track.stack}</p>
            <p className="muted">{track.focus}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
