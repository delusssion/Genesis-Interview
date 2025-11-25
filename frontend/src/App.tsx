import './App.css'
import { ChatPanel } from './components/ChatPanel'
import { InterviewStatus } from './components/InterviewStatus'
import { ShellHeader } from './components/ShellHeader'
import { TaskPane } from './components/TaskPane'
import { TrackSelection } from './components/TrackSelection'

function App() {
  return (
    <div className="app-shell">
      <ShellHeader />
      <main className="grid">
        <TrackSelection />
        <InterviewStatus />
        <ChatPanel />
        <TaskPane />
      </main>
    </div>
  )
}

export default App
