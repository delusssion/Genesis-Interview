import { env } from '../shared/config/env'

type Props = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function ShellHeader({ theme, onToggleTheme }: Props) {
  return (
    <header className="shell-header">
      <div className="brand">
        <div className="pill pill-ghost">Frontend</div>
        <div>
          <div className="brand-title">Genesis Interview Shell</div>
          <p className="brand-subtitle">
            Чекпоинт 1 · Архитектура, окружение, моковые потоки
          </p>
        </div>
      </div>
      <div className="meta">
        <div className="pill pill-ghost">
          API: {env.apiUrl}
          {!env.isApiConfigured && (
            <span className="pill pill-warning">fallback</span>
          )}
        </div>
        <div className="pill pill-accent">LLM / runner: stub</div>
        <button className="ghost-btn" type="button" onClick={onToggleTheme}>
          {theme === 'light' ? 'Dark theme' : 'Light theme'}
        </button>
      </div>
    </header>
  )
}
