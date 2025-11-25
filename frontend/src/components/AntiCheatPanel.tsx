import { useEffect, useMemo, useState } from 'react'
import {
  startAntiCheatMock,
  triggerDevtoolsMock,
  type AntiCheatSignal,
  type AntiCheatType,
} from '../shared/api/antiCheatMock'

const labels: Record<AntiCheatType, string> = {
  copy: 'Копирование',
  paste: 'Вставка',
  blur: 'Потеря фокуса',
  focus: 'Фокус',
  'visibility-hidden': 'Вкладка скрыта',
  'visibility-visible': 'Вкладка видима',
  devtools: 'DevTools',
}

const colors: Record<AntiCheatType, string> = {
  copy: 'status-in-progress',
  paste: 'status-in-progress',
  blur: 'status-todo',
  focus: 'status-ready',
  'visibility-hidden': 'status-todo',
  'visibility-visible': 'status-ready',
  devtools: 'status-failed',
}

export function AntiCheatPanel() {
  const [signals, setSignals] = useState<AntiCheatSignal[]>([])

  const addSignal = (sig: AntiCheatSignal) => {
    setSignals((prev) => [sig, ...prev].slice(0, 12))
  }

  useEffect(() => {
    const stop = startAntiCheatMock((sig) => {
      addSignal(sig)
    })
    return () => stop()
  }, [])

  const counts = useMemo(() => {
    return signals.reduce<Record<AntiCheatType, number>>(
      (acc, sig) => {
        acc[sig.type] += 1
        return acc
      },
      {
        copy: 0,
        paste: 0,
        blur: 0,
        focus: 0,
        'visibility-hidden': 0,
        'visibility-visible': 0,
        devtools: 0,
      },
    )
  }, [signals])

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Шаг 6 · анти-чит</p>
          <h2>Сигналы фронта</h2>
          <p className="muted">
            Отслеживаем copy/paste, blur/focus, видимость вкладки, простейший DevTools. Сейчас
            моки; дальше отправим эти события на бек телеметрии.
          </p>
        </div>
        <div className="pill pill-ghost">Listening</div>
      </div>

      <div className="anticheat-actions">
        <button
          className="ghost-btn"
          type="button"
          onClick={() => triggerDevtoolsMock(addSignal)}
        >
          Смоделировать DevTools
        </button>
        <button className="ghost-btn" type="button" onClick={() => setSignals([])}>
          Очистить лог
        </button>
      </div>

      <div className="anticheat-stats">
        {Object.entries(counts).map(([type, value]) => (
          <div key={type} className="stat-card">
            <div className={`status ${colors[type as AntiCheatType]}`}>{labels[type as AntiCheatType]}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="signals-list">
        {signals.length === 0 ? (
          <p className="muted">События ещё не зафиксированы. Попробуй скопировать/вставить текст или спрятать вкладку.</p>
        ) : (
          signals.map((sig) => (
            <div key={sig.id} className="signal-row">
              <span className={`status ${colors[sig.type]}`}>{labels[sig.type]}</span>
              <span className="muted">{new Date(sig.at).toLocaleTimeString()}</span>
              {sig.meta && <span className="pill pill-ghost">{sig.meta}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
