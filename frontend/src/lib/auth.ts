import { api } from './api'

/** Token terpisah: member (portal) vs admin (CMS) */
export const MEMBER_TOKEN_KEY = 'scholargate_member_token'
export const ADMIN_TOKEN_KEY = 'scholargate_admin_token'

export type AuthUser = {
  id: number
  name: string
  email: string
  role: string
  gravatar_url: string
  is_admin?: boolean
}

export function getMemberToken() {
  return localStorage.getItem(MEMBER_TOKEN_KEY)
}

export function setMemberToken(token: string | null) {
  if (token) localStorage.setItem(MEMBER_TOKEN_KEY, token)
  else localStorage.removeItem(MEMBER_TOKEN_KEY)
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  else localStorage.removeItem(ADMIN_TOKEN_KEY)
}

/** @deprecated use setAdminToken */
export function setAuthToken(token: string | null) {
  setAdminToken(token)
}

/** @deprecated use getAdminToken */
export function getAuthToken() {
  return getAdminToken()
}

/**
 * Gravatar URL (wajib). MD5 email — sama standar Gravatar.
 * Pakai di client jika API belum kirim gravatar_url.
 */
export function gravatarUrl(_email: string, size = 128): string {
  // Prefer API `gravatar_url` (MD5 di server). Fallback mystery-person.
  return `https://www.gravatar.com/avatar/?s=${size}&d=mp`
}

export async function fetchMemberMe(): Promise<AuthUser | null> {
  const token = getMemberToken()
  if (!token) return null
  try {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data.user
  } catch {
    setMemberToken(null)
    return null
  }
}

export async function memberLogin(email: string, password: string) {
  const { data } = await api.post<{ user: AuthUser; token: string }>('/auth/member/login', {
    email,
    password,
  })
  setMemberToken(data.token)
  return data
}

export async function memberLogout() {
  const token = getMemberToken()
  if (token) {
    try {
      await api.post('/auth/logout', null, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // ignore
    }
  }
  setMemberToken(null)
}

export async function adminLogin(email: string, password: string) {
  const { data } = await api.post<{ user: AuthUser; token: string }>('/auth/admin/login', {
    email,
    password,
  })
  setAdminToken(data.token)
  return data
}
