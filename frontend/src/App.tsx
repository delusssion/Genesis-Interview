import './App.css'
import { InterviewStatus } from './components/InterviewStatus'
import { ShellHeader } from './components/ShellHeader'
import { TrackSelection } from './components/TrackSelection'

function App() {
  return (
    <div className="app-shell">
      <ShellHeader />
      <main className="grid">
        <TrackSelection />
        <InterviewStatus />
      </main>
    </div>
  )
}

export default App
