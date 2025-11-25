import { useEffect, useState } from 'react'
import './App.css'
import { AntiCheatPanel } from './components/AntiCheatPanel'
import { ChatPanel } from './components/ChatPanel'
import { IdeShell } from './components/IdeShell'
import { InterviewStatus } from './components/InterviewStatus'
import { ShellHeader } from './components/ShellHeader'
import { TaskPane } from './components/TaskPane'
import { TrackSelection } from './components/TrackSelection'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="app-shell">
      <ShellHeader theme={theme} onToggleTheme={toggleTheme} />
      <main className="grid">
        <TrackSelection />
        <InterviewStatus />
        <ChatPanel />
        <TaskPane />
        <IdeShell />
        <AntiCheatPanel />
      </main>
    </div>
  )
}

export default App
