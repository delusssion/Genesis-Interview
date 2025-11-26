import { useEffect, useMemo, useState } from 'react'
import {
  startAntiCheat,
  triggerDevtools,
  type AntiCheatSignal,
  type AntiCheatType,
} from '../shared/api/antiCheat'
import { sendAnticheat } from '../shared/api/telemetry'

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

type Props = {
  sessionId: number | null
}

export function AntiCheatPanel({ sessionId }: Props) {
  const [signals, setSignals] = useState<AntiCheatSignal[]>([])
  const [buffer, setBuffer] = useState<AntiCheatSignal[]>([])
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [lastSentAt, setLastSentAt] = useState<string | null>(null)

  const addSignal = (sig: AntiCheatSignal) => {
    setSignals((prev) => [sig, ...prev].slice(0, 12))
    setBuffer((prev) => [...prev, sig])
  }

  useEffect(() => {
    const stop = startAntiCheat((sig) => {
      addSignal(sig)
    })
    return () => stop()
  }, [])

  useEffect(() => {
    if (!sessionId || buffer.length === 0 || sending) return
    const payload = [...buffer]
    const flush = async () => {
      try {
        setSending(true)
        setSendError(null)
        await sendAnticheat(
          sessionId,
          payload.map((b) => ({ type: b.type, at: b.at, meta: b.meta })),
        )
        setBuffer((prev) => prev.slice(payload.length))
        setLastSentAt(new Date().toISOString())
      } catch (e) {
        console.error('Telemetry send failed', e)
        setSendError((e as Error).message)
      } finally {
        setSending(false)
      }
    }
    const timer = setTimeout(flush, 1200)
    return () => clearTimeout(timer)
  }, [buffer, sessionId, sending])

  const flushNow = async () => {
    if (!sessionId || buffer.length === 0 || sending) return
    try {
      setSending(true)
      await sendAnticheat(
        sessionId,
        buffer.map((b) => ({ type: b.type, at: b.at, meta: b.meta })),
      )
      setBuffer([])
      setLastSentAt(new Date().toISOString())
      setSendError(null)
    } catch (e) {
      setSendError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

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
            Отслеживаем copy/paste, blur/focus, видимость вкладки, DevTools и отправляем события на
            бек телеметрии (если есть session_id).
          </p>
        </div>
        <div className="pill pill-ghost">
          {sending
            ? 'Отправляем...'
            : sendError
              ? 'Ошибка телеметрии'
              : `Буфер: ${buffer.length}`}
        </div>
      </div>

      <div className="anticheat-actions">
        <button
          className="ghost-btn"
          type="button"
          onClick={() => triggerDevtools(addSignal)}
        >
          Смоделировать DevTools
        </button>
        <button className="ghost-btn" type="button" onClick={() => setSignals([])}>
          Очистить лог
        </button>
        <button className="ghost-btn" type="button" onClick={flushNow} disabled={sending || !buffer.length || !sessionId}>
          Отправить сейчас
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
      {lastSentAt && (
        <p className="muted">
          Отправлено: {new Date(lastSentAt).toLocaleTimeString()} · накоплено: {buffer.length}
        </p>
      )}
      {sendError && <p className="muted">Не удалось отправить: {sendError}</p>}
    </div>
  )
}
