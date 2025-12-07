import type { InterviewResult } from '../shared/types/results'

type Props = {
  results: InterviewResult[]
  onSelect?: (result: InterviewResult) => void
}

export function ResultsPanel({ results, onSelect }: Props) {
  const items: InterviewResult[] =
    results.length > 0
      ? results
      : [
          {
            sessionId: 0,
            track: 'frontend',
            level: 'junior',
            status: 'in-progress',
            score: null,
            updatedAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
            feedback: 'Запусти интервью, чтобы увидеть историю.',
            durationMinutes: undefined,
            testsPassed: null,
            testsTotal: null,
            chat: [],
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
          <button
            key={res.sessionId}
            className="result-card"
            type="button"
            onClick={() => onSelect?.(res)}
            style={{
              cursor: onSelect ? 'pointer' : 'default',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
            }}
          >
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
                {res.level} ·{' '}
                {new Date(res.updatedAt).toLocaleDateString(undefined, {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="score">
              {res.score !== null && res.score !== undefined ? `${res.score} / 100` : '-'}
            </div>
            <div className="muted small" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {typeof res.testsPassed === 'number' && typeof res.testsTotal === 'number' ? (
                <span>
                  Тесты: {res.testsPassed}/{res.testsTotal}
                </span>
              ) : null}
              {res.durationMinutes ? <span>Длительность: {res.durationMinutes} мин</span> : null}
            </div>
            {res.feedback && <p className="muted">{res.feedback}</p>}
          </button>
        ))}
      </div>
    </div>
  )
}
