import type { InterviewResult } from '../shared/types/results'

type Props = {
  result: InterviewResult
  onBack: () => void
}

export function ResultDetails({ result, onBack }: Props) {
  const statusLabel =
    result.status === 'passed'
      ? 'Пройдено'
      : result.status === 'failed'
        ? 'Не пройдено'
        : 'В работе'

  const scoreLabel =
    typeof result.score === 'number' ? `${result.score} / 100` : 'Оценка появится после завершения'

  const testsLabel =
    typeof result.testsPassed === 'number' && typeof result.testsTotal === 'number'
      ? `${result.testsPassed} / ${result.testsTotal}`
      : '—'

  const completion =
    typeof result.testsPassed === 'number' && typeof result.testsTotal === 'number' && result.testsTotal > 0
      ? Math.round((result.testsPassed / result.testsTotal) * 100)
      : null

  const chat = result.chat?.length
    ? result.chat
    : [
        {
          from: 'interviewer',
          text: 'Чат будет доступен после завершения интервью.',
          at: result.updatedAt,
        },
      ]

  return (
    <div className="panel">
      <div className="panel-head" style={{ justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="ghost-btn" type="button" onClick={onBack}>
            ← Назад
          </button>
          <div>
            <p className="eyebrow">Сессия #{result.sessionId}</p>
            <h2>Детали интервью</h2>
            <p className="muted">
              {new Date(result.startedAt).toLocaleString()} · {result.track} · {result.level}
            </p>
          </div>
        </div>
        <div className={`status status-${result.status}`}>{statusLabel}</div>
      </div>

      <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div className="pill pill-ghost" style={{ justifyContent: 'space-between', display: 'flex' }}>
          <span>Оценка</span>
          <strong>{scoreLabel}</strong>
        </div>
        <div className="pill pill-ghost" style={{ justifyContent: 'space-between', display: 'flex' }}>
          <span>Тесты</span>
          <strong>{testsLabel}</strong>
        </div>
        <div className="pill pill-ghost" style={{ justifyContent: 'space-between', display: 'flex' }}>
          <span>Длительность</span>
          <strong>{result.durationMinutes ? `${result.durationMinutes} мин` : '—'}</strong>
        </div>
        <div className="pill pill-ghost" style={{ justifyContent: 'space-between', display: 'flex' }}>
          <span>Обновлено</span>
          <strong>{new Date(result.updatedAt).toLocaleString()}</strong>
        </div>
      </div>

      {completion !== null && (
        <div style={{ marginBottom: 16 }}>
          <p className="muted small">Завершенность тестов</p>
          <div style={{ height: 10, borderRadius: 6, background: 'var(--muted-border, #e5e7eb)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${completion}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2563eb, #22c55e)',
              }}
            />
          </div>
          <p className="muted small" style={{ marginTop: 4 }}>
            {completion}% ({testsLabel})
          </p>
        </div>
      )}

      {result.feedback && (
        <div className="panel panel-compact" style={{ marginBottom: 16 }}>
          <p className="eyebrow">Фидбек</p>
          <p>{result.feedback}</p>
        </div>
      )}

      <div className="panel panel-compact">
        <p className="eyebrow">История чата</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className="chat-bubble"
              style={{
                alignSelf: msg.from === 'candidate' ? 'flex-end' : 'flex-start',
                background: msg.from === 'candidate' ? '#e0f2fe' : '#f8fafc',
                border: '1px solid #e5e7eb',
                padding: '10px 12px',
                borderRadius: 10,
                maxWidth: '100%',
                minWidth: '200px',
              }}
            >
              <div className="muted small">
                {msg.from === 'candidate' ? 'Вы' : 'Интервьюер'} ·{' '}
                {new Date(msg.at).toLocaleTimeString()}
              </div>
              <div>{msg.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
