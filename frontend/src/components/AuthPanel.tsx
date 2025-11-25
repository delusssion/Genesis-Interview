import { type FormEvent, useState } from 'react'
import { authMock, type AuthMode } from '../shared/api/authMock'

const initialState = {
  email: '',
  nickname: '',
  password: '',
  confirmPassword: '',
}

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [form, setForm] = useState(initialState)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  const onSubmit = async (evt: FormEvent) => {
    evt.preventDefault()
    setStatus('loading')
    setMessage('')

    const resp = await authMock(mode, {
      email: form.email,
      nickname: form.nickname,
      password: form.password,
      confirmPassword: form.confirmPassword,
    })

    if (resp.success) {
      setStatus('ok')
      setMessage(`Успех. Токен: ${resp.token}`)
    } else {
      setStatus('error')
      setMessage(resp.error)
    }
  }

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Шаг 0 · Авторизация</p>
          <h2>Логин/регистрация</h2>
          <p className="muted">
            Моковые формы по никнейму и email. После согласования с беком
            переключим на реальные эндпоинты.
          </p>
        </div>
        <div className="pill pill-ghost">{mode === 'login' ? 'Login' : 'Register'}</div>
      </div>

      <div className="auth-tabs">
        <button
          type="button"
          className={`ghost-btn ${mode === 'login' ? 'ghost-active' : ''}`}
          onClick={() => setMode('login')}
          disabled={status === 'loading'}
        >
          Вход
        </button>
        <button
          type="button"
          className={`ghost-btn ${mode === 'register' ? 'ghost-active' : ''}`}
          onClick={() => setMode('register')}
          disabled={status === 'loading'}
        >
          Регистрация
        </button>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        {mode === 'register' && (
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
        )}
        <label className="field">
          <span>Ник</span>
          <input
            value={form.nickname}
            onChange={(e) => update('nickname', e.target.value)}
            placeholder="Введите ник"
            minLength={3}
            required
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="Не менее 8 символов"
            minLength={8}
            required
          />
        </label>
        {mode === 'register' && (
          <label className="field">
            <span>Подтверждение</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              placeholder="Повторите пароль"
              minLength={8}
              required
            />
          </label>
        )}

        <button className="cta" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      {message && (
        <div className={`auth-message ${status === 'ok' ? 'ok' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
