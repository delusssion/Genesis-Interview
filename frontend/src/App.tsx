import { useEffect, useMemo, useState } from 'react'
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
type DurationOption = 15 | 30 | 60 | 120
type Track =
  | 'frontend'
  | 'backend'
  | 'data'
  | 'ml'
  | 'devops'
  | 'mobile'

const trackCards: {
  id: Track
  title: string
  icon: string
  description: string
  available: boolean
}[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    icon: '🌐',
    description: 'HTML, CSS, TS/JS, SPA, React',
    available: true,
  },
  {
    id: 'backend',
    title: 'Backend',
    icon: '⚙️',
    description: 'API, базы данных, очереди, масштабирование',
    available: true,
  },
  {
    id: 'data',
    title: 'Data Engineer',
    icon: '📊',
    description: 'Python, SQL, Spark, пайплайны данных',
    available: true,
  },
  {
    id: 'ml',
    title: 'ML Engineer',
    icon: '🤖',
    description: 'Python, ML-модели, статистика, MLOps',
    available: true,
  },
  {
    id: 'devops',
    title: 'DevOps',
    icon: '⚡',
    description: 'CI/CD, Kubernetes, облака, инфраструктура',
    available: false,
  },
  {
    id: 'mobile',
    title: 'Mobile / QA',
    icon: '📱',
    description: 'iOS/Android, тестирование, автоматизация',
    available: false,
  },
]

const techStack: Record<
  Track,
  { key: string; label: string; value: 'python' | 'typescript' | 'go' }[]
> = {
  frontend: [
    { key: 'frontend-js', label: 'JavaScript', value: 'typescript' },
    { key: 'frontend-ts', label: 'TypeScript', value: 'typescript' },
    { key: 'frontend-react', label: 'React', value: 'typescript' },
    { key: 'frontend-vue', label: 'Vue', value: 'typescript' },
    { key: 'frontend-node', label: 'Node.js', value: 'typescript' },
  ],
  backend: [
    { key: 'backend-python', label: 'Python', value: 'python' },
    { key: 'backend-go', label: 'Go', value: 'go' },
    { key: 'backend-ts', label: 'TypeScript', value: 'typescript' },
    { key: 'backend-node', label: 'Node.js', value: 'typescript' },
  ],
  data: [
    { key: 'data-python', label: 'Python', value: 'python' },
    { key: 'data-sql', label: 'SQL', value: 'python' },
    { key: 'data-spark', label: 'Spark', value: 'python' },
    { key: 'data-airflow', label: 'Airflow', value: 'python' },
  ],
  ml: [
    { key: 'ml-python', label: 'Python', value: 'python' },
    { key: 'ml-pytorch', label: 'PyTorch', value: 'python' },
    { key: 'ml-tf', label: 'TensorFlow', value: 'python' },
    { key: 'ml-sklearn', label: 'Sklearn', value: 'python' },
  ],
  devops: [],
  mobile: [],
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [view, setView] = useState<View>('home')
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<'junior' | 'middle' | 'senior'>('junior')
  const [selectedTrack, setSelectedTrack] = useState<Track>('frontend')
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'python' | 'go' | null>(
    null,
  )
  const [selectedStacks, setSelectedStacks] = useState<string[]>([])
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(15)
  const [showFinishModal, setShowFinishModal] = useState(false)
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

  useEffect(() => {
    setSelectedLanguage(null)
    setSelectedStacks([])
  }, [selectedTrack])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const showToast = (message: string) => {
    const id = Date.now()
    setToast({ id, message })
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 5200)
  }

  const handleStart = async () => {
    if (!isAuthenticated) {
      showToast('Требуется авторизация')
      setView('auth')
      return
    }
    if (!selectedLanguage) {
      showToast('Выберите стек, прежде чем начинать интервью')
      return
    }
    setIsStarting(true)
    try {
      const res = await startInterview({
        track:
          selectedTrack === 'devops' || selectedTrack === 'mobile'
            ? 'frontend'
            : (selectedTrack as 'frontend' | 'backend' | 'data' | 'ml'),
        level: selectedLevel,
        preferred_language: selectedLanguage,
        duration_minutes: selectedDuration,
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

  const stackOptions = useMemo(() => techStack[selectedTrack] ?? [], [selectedTrack])

  const renderHome = () => (
    <div className="home-dribbble">
      <div className="background-blob blob-1" />
      <div className="background-blob blob-2" />
      <div className="background-blob blob-3" />

      <section className="hero hero-dribbble">
        <h1 className="hero-title">Genesis Interview – автоматизированное интервью за 15 минут</h1>
        <p className="hero-subtitle">
          Пройди собеседование в реальных условиях: выбери специализацию, уровень и стек — и система
          сгенерирует интервью, адаптированное под тебя.
        </p>
      </section>

      <section className="section-grid">
        <div className="panel glass hero-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Выбери свою специализацию</p>
              <h2>Направления</h2>
            </div>
          </div>
          <div className="track-grid">
            {trackCards.map((card) => {
              const isSelected = selectedTrack === card.id
              return (
                <button
                  key={card.id}
                  className={`track-card ${isSelected ? 'selected' : ''} ${
                    !card.available ? 'soon' : ''
                  }`}
                  type="button"
                  onClick={() => {
                    if (!card.available) {
                      showToast('Скоро откроем это направление')
                      return
                    }
                    setSelectedTrack(card.id)
                    setSelectedLanguage(null)
                    setSelectedStacks([])
                  }}
                >
                  <div className="track-icon">{card.icon}</div>
                  <div className="track-content">
                    <div className="track-title">
                      <span>{card.title}</span>
                      {!card.available && <span className="track-badge">Soon</span>}
                    </div>
                    <p>{card.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="panel glass">
          <div className="section-head">
            <div>
              <p className="eyebrow">Ваш уровень</p>
              <h3>На какой уровень проводим интервью</h3>
            </div>
          </div>
          <div className="chips">
            {(['junior', 'middle', 'senior'] as const).map((lvl) => (
              <button
                key={lvl}
                className={`chip ${selectedLevel === lvl ? 'chip-active' : ''}`}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="panel glass">
          <div className="section-head">
            <div>
              <p className="eyebrow">Технический стек</p>
              <h3>Выбери язык и стек</h3>
            </div>
          </div>
          <div className="chips wrap">
            {stackOptions.length ? (
              stackOptions.map((stack) => (
                <button
                  key={stack.key}
                  className={`chip ${selectedStacks.includes(stack.key) ? 'chip-active' : ''}`}
                  type="button"
                  onClick={() => {
                    setSelectedStacks((prev) => {
                      const isSelected = prev.includes(stack.key)
                      if (isSelected) {
                        const next = prev.filter((k) => k !== stack.key)
                        if (!next.length) {
                          setSelectedLanguage(null)
                        } else {
                          const lastKey = next[next.length - 1]
                          const lastStack = stackOptions.find((s) => s.key === lastKey)
                          setSelectedLanguage(lastStack?.value ?? null)
                        }
                        return next
                      }
                      const next = [...prev, stack.key]
                      setSelectedLanguage(stack.value)
                      return next
                    })
                  }}
                >
                  {stack.label}
                </button>
              ))
            ) : (
              <p className="muted">Выберите доступное направление, чтобы указать стек</p>
            )}
          </div>
        </div>

        <div className="panel glass">
          <div className="section-head">
            <div>
              <p className="eyebrow">Длительность</p>
              <h3>Выберите формат</h3>
            </div>
          </div>
          <div className="chips wrap">
            {[15, 30, 60, 120].map((minutes) => (
              <button
                key={minutes}
                className={`chip ${selectedDuration === minutes ? 'chip-active' : ''}`}
                type="button"
                onClick={() => setSelectedDuration(minutes as DurationOption)}
              >
                {minutes === 15
                  ? '15 минут'
                  : minutes === 30
                    ? '30 минут'
                    : minutes === 60
                      ? '1 час'
                      : '2 часа'}
              </button>
            ))}
          </div>
        </div>

        <div className="panel glass info-cards">
          <div className="section-head">
            <div>
              <p className="eyebrow">Как проходит интервью</p>
              <h3>Процесс</h3>
            </div>
          </div>
          <div className="info-grid">
            <div className="info-card">
              <span className="info-icon">⏱</span>
              <h4>
                {selectedDuration === 15
                  ? '15 минут'
                  : selectedDuration === 30
                    ? '30 минут'
                    : selectedDuration === 60
                      ? '1 час'
                      : '2 часа'}
              </h4>
              <p>Длительность по вашему выбору</p>
            </div>
            <div className="info-card">
              <span className="info-icon">❓</span>
              <h4>5–30 вопросов</h4>
              <p>Технические и ситуационные вопросы</p>
            </div>
            <div className="info-card">
              <span className="info-icon">📊</span>
              <h4>Детальный результат</h4>
              <p>Сильные стороны и рекомендации по улучшению</p>
            </div>
          </div>
        </div>
      </section>

      <div className="cta-shell">
        <button className="cta-hero" type="button" onClick={handleStart} disabled={isStarting}>
          {isStarting ? 'Запуск...' : 'Начать интервью'}
        </button>
      </div>
    </div>
  )

  const renderAuth = () => (
    <div className="full-card">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Аккаунт</p>
          <h2>Авторизация</h2>
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
      <div className="workspace chat-only" id="interview-workspace">
        <ChatPanel
          sessionId={sessionId}
          onFinish={() => {
            setShowFinishModal(true)
          }}
        />

        <div className="panel code-runner">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Раннер</p>
              <h3>Пишите и гоняйте код по запросу интервьюера</h3>
            </div>
          </div>
          <IdeShell
            sessionId={sessionId}
            taskId={currentTaskId}
            language={(selectedLanguage ?? 'typescript') as 'typescript' | 'python' | 'go'}
            onProgress={handleProgressUpdate}
          />
        </div>
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
          showToast('Вы вышли из аккаунта')
        }}
        onGoHome={() => setView('home')}
      />

      {view === 'home' && renderHome()}
      {view === 'auth' && renderAuth()}
      {view === 'results' && renderResults()}
      {view === 'interview' && renderInterview()}

      {showFinishModal && (
        <div className="modal-backdrop" onClick={() => setShowFinishModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Вы уверены, что хотите закончить интервью?</h3>
            <p className="muted small">Результат не будет сохранен.</p>
            <div className="modal-actions">
              <button
                className="cta"
                type="button"
                onClick={() => {
                  setShowFinishModal(false)
                  setSessionId(null)
                  setCurrentTaskId(null)
                  setView('home')
                  showToast('Интервью завершено без сохранения')
                }}
              >
                Подтвердить
              </button>
              <button className="ghost-btn" type="button" onClick={() => setShowFinishModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

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
