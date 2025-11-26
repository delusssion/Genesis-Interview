import { useEffect, useState } from 'react'
import './App.css'
import { AntiCheatPanel } from './components/AntiCheatPanel'
import { AuthPanel } from './components/AuthPanel'
import { ChatPanel } from './components/ChatPanel'
import { IdeShell } from './components/IdeShell'
import { ResultsPanel } from './components/ResultsPanel'
import { ShellHeader } from './components/ShellHeader'
import { TaskPane } from './components/TaskPane'
import { TrackSelection } from './components/TrackSelection'
import { startInterview } from './shared/api/interview'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<'junior' | 'middle' | 'senior'>('junior')
  const [selectedTrack, setSelectedTrack] = useState<'frontend' | 'backend' | 'data' | 'ml'>(
    'frontend',
  )
  const [selectedLanguage, setSelectedLanguage] = useState('typescript')
  const [results, setResults] = useState<
    {
      sessionId: number
      track: string
      level: string
      status: 'in-progress' | 'passed' | 'failed'
      score?: number | null
      feedback?: string
      updatedAt: string
    }[]
  >([])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const handleStart = async (opts: {
    track: 'frontend' | 'backend' | 'data' | 'ml'
    level: 'junior' | 'middle' | 'senior'
    language: 'typescript' | 'python' | 'go'
  }) => {
    setIsStarting(true)
    setSelectedLevel(opts.level)
    setSelectedTrack(opts.track)
    setSelectedLanguage(opts.language)
    try {
      const res = await startInterview({
        track: opts.track,
        level: opts.level,
        preferred_language: opts.language,
        user_id: 'frontend-user',
        locale: 'ru',
      })
      if (res.success && typeof res.session_id === 'number') {
        const sessionId = res.session_id
        setSessionId(sessionId)
        setCurrentTaskId(null)
        const now = new Date().toISOString()
        setResults((prev) =>
          [
            {
              sessionId,
              track: opts.track,
              level: opts.level,
              status: 'in-progress' as const,
              score: null,
              feedback: '',
              updatedAt: now,
            },
            ...prev.filter((r) => r.sessionId !== res.session_id),
          ].slice(0, 6),
        )
      } else {
        alert('Не удалось создать сессию')
      }
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setIsStarting(false)
    }
  }

  const handleProgressUpdate = (data: {
    sessionId: number
    state: string
    quality?: number | null
    testsPassed?: number | null
    testsTotal?: number | null
    feedback?: string
  }) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.sessionId === data.sessionId)
      const status: 'in-progress' | 'passed' | 'failed' =
        data.state === 'feedback_ready'
          ? data.quality && data.quality >= 80 && data.testsPassed !== 0
            ? 'passed'
            : 'failed'
          : 'in-progress'
      const score =
        typeof data.quality === 'number'
          ? data.quality
          : data.testsPassed && data.testsTotal
            ? Math.round((data.testsPassed / data.testsTotal) * 100)
            : existing?.score ?? null
      const merged = {
        sessionId: data.sessionId,
        track: existing?.track ?? selectedTrack,
        level: existing?.level ?? selectedLevel,
        status,
        score,
        feedback: data.feedback ?? existing?.feedback,
        updatedAt: new Date().toISOString(),
      }
      const rest = prev.filter((r) => r.sessionId !== data.sessionId)
      return [merged, ...rest].slice(0, 6)
    })
  }

  return (
    <div className="app-shell">
      <ShellHeader theme={theme} onToggleTheme={toggleTheme} sessionId={sessionId} />

      <section className="overview">
        <div className="overview-card">
          <p className="eyebrow">Статус</p>
          <h3>{sessionId ? `Сессия #${sessionId}` : 'Сессия не запущена'}</h3>
          <p className="muted">Перед стартом авторизуйся, затем выбери трек/уровень/язык.</p>
        </div>
        <div className="overview-card">
          <p className="eyebrow">Настройки интервью</p>
          <h3>
            {selectedTrack.toUpperCase()} · {selectedLevel.toUpperCase()} · {selectedLanguage}
          </h3>
          <p className="muted">Выбери направление, чтобы начать новую сессию.</p>
        </div>
        <div className="overview-card">
          <p className="eyebrow">Тема</p>
          <h3>{theme === 'light' ? 'Светлая' : 'Тёмная'}</h3>
          <p className="muted">Переключатель доступен в шапке.</p>
        </div>
      </section>

      <main className="layout">
        <div className="column column-left">
          <AuthPanel />
          <TrackSelection onStart={handleStart} isStarting={isStarting} />
          <ResultsPanel results={results} />
        </div>
        <div className="column column-right">
          <div className="workspace">
            <ChatPanel sessionId={sessionId} />
            <TaskPane
            sessionId={sessionId}
            level={selectedLevel}
            language={selectedLanguage}
            onTaskChange={(taskId) => setCurrentTaskId(taskId)}
            onProgress={handleProgressUpdate}
          />
          <IdeShell
            sessionId={sessionId}
            taskId={currentTaskId}
            language={selectedLanguage}
            onProgress={handleProgressUpdate}
          />
          <AntiCheatPanel sessionId={sessionId} />
        </div>
      </div>
    </main>
    </div>
  )
}

export default App
