export type AuthMode = 'login' | 'register'

export type AuthPayload = {
  email?: string
  nickname: string
  password: string
  confirmPassword?: string
}

export type AuthResponse =
  | { success: true; token: string }
  | { success: false; error: string }

const makeToken = (nickname: string) =>
  `mock-${nickname}-${Date.now().toString(36)}`

export async function authMock(
  mode: AuthMode,
  payload: AuthPayload,
): Promise<AuthResponse> {
  // simple mocked validation
  if (mode === 'register' && payload.password !== payload.confirmPassword) {
    return { success: false, error: 'Пароли не совпадают' }
  }

  if (!payload.nickname || payload.nickname.length < 3) {
    return { success: false, error: 'Ник должен быть не короче 3 символов' }
  }

  if (mode === 'register' && !payload.email) {
    return { success: false, error: 'Укажите email' }
  }

  const hasFail = payload.nickname.toLowerCase().includes('fail')

  return new Promise((resolve) => {
    setTimeout(() => {
      if (hasFail) {
        resolve({ success: false, error: 'Мок: неверные данные' })
      } else {
        resolve({ success: true, token: makeToken(payload.nickname) })
      }
    }, 500)
  })
}
