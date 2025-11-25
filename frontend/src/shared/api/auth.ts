import { api } from './client'

type AuthResponse = { success: true } | { success: false; detail?: string }

export async function login(nickname: string, password: string) {
  return api.post<AuthResponse>('/auth/login', { nickname, password })
}

export async function register(email: string, nickname: string, password: string) {
  return api.post<AuthResponse>('/auth/register', {
    email,
    nickname,
    password,
    confirm_password: password,
  })
}
