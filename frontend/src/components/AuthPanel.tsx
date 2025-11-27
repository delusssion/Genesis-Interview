import { type FormEvent, useState } from 'react'
import { login, register } from '../shared/api/auth'

type AuthMode = 'login' | 'register'

const initialState = {
  email: '',
  nickname: '',
  password: '',
  confirmPassword: '',
}

type Props = {
  onAuthSuccess?: () => void
  onRedirectHome?: () => void
  onNotify?: (msg: string) => void
}

export function AuthPanel({ onAuthSuccess, onRedirectHome, onNotify }: Props) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [form, setForm] = useState(initialState)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const onSubmit = async (evt: FormEvent) => {
    evt.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      if (mode === 'login') {
        await login(form.nickname, form.password)
        setStatus('ok')
        setMessage('Успешный вход')
        onNotify?.('Успешный вход')
        onAuthSuccess?.()
        setTimeout(() => onRedirectHome?.(), 1000)
      } else {
        if (form.password !== form.confirmPassword) {
          setStatus('error')
          const err = 'Пароль и подтверждение не совпадают'
          setMessage(err)
          onNotify?.(err)
          return
        }
        await register(form.email, form.nickname, form.password, form.confirmPassword)
        await login(form.nickname, form.password)
        setStatus('ok')
        setMessage('Успешная регистрация')
        onNotify?.('Успешная регистрация')
        onAuthSuccess?.()
        setTimeout(() => onRedirectHome?.(), 1000)
      }
    } catch (e) {
      setStatus('error')
      const errMsg = (e as Error).message
      setMessage(errMsg)
      onNotify?.(errMsg)
    }
  }

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="panel">
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
      <p className="muted" style={{ marginTop: -4 }}>
        {mode === 'login'
          ? 'Вход по никнейму или email. После входа доступен старт интервью.'
          : 'Регистрация по никнейму и email. После регистрации доступен старт интервью.'}
      </p>

      <form className="auth-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          <span>{mode === 'login' ? 'Ник или email' : 'Ник'}</span>
          <input
            value={form.nickname}
            onChange={(e) => update('nickname', e.target.value)}
            placeholder={mode === 'login' ? 'nickname или you@example.com' : 'Введите ник'}
            minLength={3}
            required
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Не менее 8 символов"
              minLength={8}
              required
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {showPassword ? 'Скрыть' : 'Показать'}
            </button>
          </div>
        </label>
        {mode === 'register' && (
          <label className="field">
            <span>Подтверждение</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="Повторите пароль"
                minLength={8}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowConfirm((prev) => !prev)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showConfirm ? 'Скрыть' : 'Показать'}
              </button>
            </div>
          </label>
        )}

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="cta full-width" style={{ maxWidth: 360 }} type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`auth-message ${status === 'ok' ? 'ok' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
