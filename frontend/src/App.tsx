import { useEffect, useState } from 'react'
import './App.css'
import { AuthPanel } from './components/AuthPanel'
import { ChatPanel } from './components/ChatPanel'
import { IdeShell } from './components/IdeShell'
import { ResultsPanel } from './components/ResultsPanel'
import { ShellHeader } from './components/ShellHeader'
import { TaskPane } from './components/TaskPane'
import { logout as logoutApi, me, refresh } from './shared/api/auth'
import { startInterview } from './shared/api/interview'

type View = 'home' | 'auth' | 'results' | 'interview'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [view, setView] = useState<View>('home')
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<'junior' | 'middle' | 'senior'>('junior')
  const [selectedTrack, setSelectedTrack] = useState<'frontend' | 'backend' | 'data' | 'ml'>(
    'frontend',
  )
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'python' | 'go'>(
    'typescript',
  )
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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

  useEffect(() => {
    let cancelled = false
    const hydrateAuth = async () => {
      try {
        const meResp = await me()
        if (meResp.success) {
          if (!cancelled) setIsAuthenticated(true)
          return
        }
      } catch (_) {
        /* silent */
      }

      try {
        const refreshed = await refresh()
        if (refreshed.success) {
          const meResp = await me()
          if (!cancelled) setIsAuthenticated(meResp.success)
        } else if (!cancelled) {
          setIsAuthenticated(false)
        }
      } catch (_) {
        if (!cancelled) setIsAuthenticated(false)
      }
    }

    hydrateAuth()
    return () => {
      cancelled = true
    }
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const showToast = (message: string) => {
    const id = Date.now()
    setToast({ id, message })
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 5000)
  }

  const handleStart = async () => {
    if (!isAuthenticated) {
      alert('Сначала авторизуйся')
      setView('auth')
      return
    }
    setIsStarting(true)
    try {
      const res = await startInterview({
        track: selectedTrack,
        level: selectedLevel,
        preferred_language: selectedLanguage,
        user_id: 'frontend-user',
        locale: 'ru',
      })
      if (res.success && typeof res.session_id === 'number') {
        const newSessionId = res.session_id
        setSessionId(newSessionId)
        setCurrentTaskId(null)
        setView('interview')
        const now = new Date().toISOString()
        setResults((prev) =>
          [
            {
              sessionId: newSessionId,
              track: selectedTrack,
              level: selectedLevel,
              status: 'in-progress' as const,
              score: null,
              feedback: '',
              updatedAt: now,
            },
            ...prev.filter((r) => r.sessionId !== newSessionId),
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

  const renderHome = () => (
    <>
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Genesis Interview</p>
          <h1>Полностью автоматизированное тех-интервью</h1>
          <p className="muted">
            Привет! Это Genesis Interview. Выбери трек, уровень и язык — и нажми “Начать интервью”.
          </p>
        </div>
        <div className="start-card wide">
          <div className="start-sections">
            <div className="selector-group">
              <p className="selector-label">Трек</p>
              <div className="selector-options">
                {(['frontend', 'backend', 'data', 'ml'] as const).map((track) => (
                  <button
                    key={track}
                    className={`selector-btn ${selectedTrack === track ? 'active' : ''}`}
                    onClick={() => setSelectedTrack(track)}
                    type="button"
                  >
                    {track}
                  </button>
                ))}
              </div>
            </div>
            <div className="selector-group">
              <p className="selector-label">Уровень</p>
              <div className="selector-options">
                {(['junior', 'middle', 'senior'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    className={`selector-btn ${selectedLevel === lvl ? 'active' : ''}`}
                    onClick={() => setSelectedLevel(lvl)}
                    type="button"
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            <div className="selector-group">
              <p className="selector-label">Язык программирования</p>
              <div className="selector-options">
                {(['typescript', 'python', 'go'] as const).map((lang) => (
                  <button
                    key={lang}
                    className={`selector-btn ${selectedLanguage === lang ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage(lang)}
                    type="button"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className="cta" type="button" onClick={handleStart} disabled={isStarting}>
            {isStarting ? 'Запуск...' : 'Начать интервью'}
          </button>
        </div>
      </section>
    </>
  )

  const renderAuth = () => (
    <div className="full-card">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Аккаунт</p>
          <h2>Вход или регистрация</h2>
        </div>
        <button className="ghost-btn" type="button" onClick={() => setView('home')}>
          Вернуться в меню
        </button>
      </div>
      <AuthPanel
        onAuthSuccess={() => setIsAuthenticated(true)}
        onRedirectHome={() => setView('home')}
        onNotify={(msg) => showToast(msg)}
      />
    </div>
  )

  const renderResults = () => (
    <div className="full-card">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Результаты</p>
          <h2>Мои результаты</h2>
        </div>
        <button className="ghost-btn" type="button" onClick={() => setView('home')}>
          Вернуться в меню
        </button>
      </div>
      <ResultsPanel results={results} />
    </div>
  )

  const renderInterview = () => (
    <main className="layout">
      <div className="workspace" id="interview-workspace">
        <ChatPanel sessionId={sessionId} />
        {currentTaskId && (
          <>
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
          </>
        )}
      </div>
    </main>
  )

  return (
    <div className="app-shell">
      <ShellHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowAuth={() => setView('auth')}
        onShowResults={() => setView('results')}
        isAuthenticated={isAuthenticated}
        onLogout={async () => {
          try {
            await logoutApi()
          } catch (_) {
            /* silent */
          }
          setIsAuthenticated(false)
          setSessionId(null)
          setCurrentTaskId(null)
          setView('home')
        }}
      />

      {view === 'home' && renderHome()}
      {view === 'auth' && renderAuth()}
      {view === 'results' && renderResults()}
      {view === 'interview' && renderInterview()}

      {toast && (
        <div className="toast" onClick={() => setToast(null)}>
          <span>{toast.message}</span>
          <button className="ghost-btn" type="button" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default App
