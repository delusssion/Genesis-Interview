import { useEffect, useState } from 'react'
import './App.css'
import { AntiCheatPanel } from './components/AntiCheatPanel'
import { AuthPanel } from './components/AuthPanel'
import { ChatPanel } from './components/ChatPanel'
import { IdeShell } from './components/IdeShell'
import { InterviewStatus } from './components/InterviewStatus'
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
  const [selectedLanguage, setSelectedLanguage] = useState('typescript')

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
    setSelectedLanguage(opts.language)
    try {
      const res = await startInterview({
        track: opts.track,
        level: opts.level,
        preferred_language: opts.language,
        user_id: 'frontend-user',
        locale: 'ru',
      })
      if (res.success && res.session_id) {
        setSessionId(res.session_id)
        setCurrentTaskId(null)
      } else {
        alert('Не удалось создать сессию')
      }
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="app-shell">
      <ShellHeader theme={theme} onToggleTheme={toggleTheme} />
      <main className="grid">
        <AuthPanel />
        <TrackSelection onStart={handleStart} isStarting={isStarting} />
        <InterviewStatus />
        <ChatPanel sessionId={sessionId} />
        <TaskPane
          sessionId={sessionId}
          level={selectedLevel}
          onTaskChange={(taskId) => setCurrentTaskId(taskId)}
        />
        <IdeShell sessionId={sessionId} taskId={currentTaskId} language={selectedLanguage} />
        <AntiCheatPanel sessionId={sessionId} />
      </main>
    </div>
  )
}

export default App
