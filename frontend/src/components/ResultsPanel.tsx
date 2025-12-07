type Result = {
  sessionId: number
  track: string
  level: string
  status: 'passed' | 'failed' | 'in-progress'
  score?: number | null
  updatedAt: string
  feedback?: string
}

type Props = {
  results: Result[]
}

export function ResultsPanel({ results }: Props) {
  const items = results.length
    ? results
    : [
        {
          sessionId: 0,
          track: 'Нет сессий',
          level: '-',
          status: 'in-progress',
          score: null,
          updatedAt: new Date().toISOString(),
          feedback: 'Запусти интервью, чтобы увидеть историю.',
        },
      ]

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">История</p>
          <h2>Мои результаты</h2>
          <p className="muted">Последние интервью и статусы.</p>
        </div>
        <div className="pill pill-ghost">{results.length ? 'Live' : 'Пока пусто'}</div>
      </div>
      <div className="results-grid">
        {items.map((res) => (
          <div key={res.sessionId} className="result-card">
            <div className="result-top">
              <span className="pill pill-ghost">
                {res.sessionId ? `#${res.sessionId}` : '-'}
              </span>
              <span className={`status status-${res.status}`}>
                {res.status === 'passed'
                  ? 'успех'
                  : res.status === 'in-progress'
                    ? 'в работе'
                    : 'не пройдено'}
              </span>
            </div>
            <div className="result-info">
              <div>{res.track}</div>
              <div className="muted">
                {res.level} · {new Date(res.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="score">
              {res.score !== null && res.score !== undefined ? `${res.score} / 100` : '-'}
            </div>
            {res.feedback && <p className="muted">{res.feedback}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
