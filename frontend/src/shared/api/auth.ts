import { api } from './client'

export type AuthResponse =
  | { success: true; access_token?: string; refresh_token?: string }
  | { success: false; detail?: string }

export async function login(identifier: string, password: string) {
  const res = await api.post<AuthResponse>('/auth/login', { identifier, password })
  if (res.success && res.access_token) {
    localStorage.setItem('access_token', res.access_token)
  }
  return res
}

export async function register(email: string, nickname: string, password: string) {
  return api.post<AuthResponse>('/auth/register', {
    email,
    nickname,
    password,
    confirm_password: password,
  })
}

export async function me() {
  return api.get<AuthResponse>('/auth/me')
}

export async function refresh() {
  return api.get<AuthResponse>('/auth/refresh')
}

export async function logout() {
  return api.post<AuthResponse>('/auth/logout')
}
