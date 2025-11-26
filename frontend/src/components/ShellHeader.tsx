import { env } from '../shared/config/env'

type Props = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  sessionId: number | null
}

export function ShellHeader({ theme, onToggleTheme, sessionId }: Props) {
  return (
    <header className="shell-header">
      <div className="brand">
        <div className="pill pill-ghost">Genesis Interview</div>
        <div>
          <div className="brand-title">Interview Console</div>
          <p className="brand-subtitle">Scibox · FastAPI · Vite/React</p>
        </div>
      </div>
      <div className="meta">
        <nav className="nav-links">
          <span className="nav-link">Дашборд</span>
          <span className="nav-link">Мои результаты</span>
          <span className="nav-link">Интервью</span>
        </nav>
        <div className="pill pill-ghost">
          API: {env.apiUrl} {!env.isApiConfigured && <span className="pill pill-warning">env?</span>}
        </div>
        <div className="pill pill-accent">
          {sessionId ? `Session #${sessionId}` : 'Нет сессии'}
        </div>
        <button className="ghost-btn" type="button" onClick={onToggleTheme}>
          {theme === 'light' ? 'Dark theme' : 'Light theme'}
        </button>
      </div>
    </header>
  )
}
