import { useState } from 'react'

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

type Props = {
  onStart: (opts: {
    track: 'frontend' | 'backend' | 'data' | 'ml'
    level: 'junior' | 'middle' | 'senior'
    language: 'typescript' | 'python' | 'go'
  }) => void
  isStarting: boolean
}

export function TrackSelection({ onStart, isStarting }: Props) {
  const [selectedTrack, setSelectedTrack] = useState<'frontend' | 'backend' | 'data' | 'ml'>('frontend')
  const [selectedLevel, setSelectedLevel] = useState<'junior' | 'middle' | 'senior'>('junior')
  const [language, setLanguage] = useState<'typescript' | 'python' | 'go'>('typescript')

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
        <button
          className="cta"
          type="button"
          disabled={isStarting}
          onClick={() => onStart({ track: selectedTrack, level: selectedLevel, language })}
        >
          {isStarting ? 'Запуск...' : 'Начать интервью'}
        </button>
      </div>

      <div className="levels">
        {levels.map((level) => {
          const value = level.toLowerCase() as 'junior' | 'middle' | 'senior'
          return (
            <button
              key={level}
              type="button"
              className={`level-pill ${selectedLevel === value ? 'selected' : ''}`}
              onClick={() => setSelectedLevel(value)}
            >
              {level}
            </button>
          )
        })}
      </div>

      <div className="tracks-grid">
        {tracks.map((track) => (
          <button
            key={track.id}
            className={`track-card ${selectedTrack === track.id ? 'selected' : ''}`}
            onClick={() => setSelectedTrack(track.id as 'frontend' | 'backend' | 'data' | 'ml')}
            type="button"
          >
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
          </button>
        ))}
      </div>

      <div className="levels">
        {['typescript', 'python', 'go'].map((lang) => (
          <button
            key={lang}
            type="button"
            className={`level-pill ${language === lang ? 'selected' : ''}`}
            onClick={() => setLanguage(lang as 'typescript' | 'python' | 'go')}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  )
}
