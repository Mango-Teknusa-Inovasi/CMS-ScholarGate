import { api, ensureCsrf } from './api'
import { router } from '@inertiajs/react'

export type AuthUser = {
  id: number
  name: string
  email: string
  role: string
  gravatar_url: string
  is_admin?: boolean
  /** role === 'admin' only (bukan editor) */
  is_super_admin?: boolean
}

/** Legacy localStorage keys — cleared on login/logout for migration */
export const MEMBER_TOKEN_KEY = 'scholargate_member_token'
export const ADMIN_TOKEN_KEY = 'scholargate_admin_token'

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

export function gravatarUrl(_email: string, size = 128): string {
  return `https://www.gravatar.com/avatar/?s=${size}&d=mp`
}

export async function fetchMemberMe(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me')
    return data.user
  } catch {
    setMemberToken(null)
    return null
  }
}

export async function fetchAdminMe(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me')
    if (!data.user?.is_admin && data.user?.role !== 'admin' && data.user?.role !== 'editor') {
      setAdminToken(null)
      return null
    }
    return data.user
  } catch {
    setAdminToken(null)
    return null
  }
}

export async function memberLogin(email: string, password: string) {
  await ensureCsrf()
  const { data } = await api.post<{ user: AuthUser; token?: string }>('/auth/member/login', {
    email,
    password,
  })
  // Prefer session; keep token if server still returns one
  if (data.token) setMemberToken(data.token)
  else setMemberToken(null)
  setAdminToken(null)
  return data
}

export async function memberLogout() {
  try {
    await ensureCsrf()
    await api.post('/auth/logout')
  } catch {
    // ignore
  }
  setMemberToken(null)
}

export async function adminLogin(email: string, password: string) {
  await ensureCsrf()
  const { data } = await api.post<{ user: AuthUser; token?: string }>('/auth/admin/login', {
    email,
    password,
  })
  if (data.token) setAdminToken(data.token)
  else setAdminToken('session') // truthy marker for UI that still checks token presence
  setMemberToken(null)
  return data
}

export async function adminLogout() {
  try {
    await ensureCsrf()
    await api.post('/auth/logout')
  } catch {
    // ignore
  }
  setAdminToken(null)
  router.visit('/admin/login')
}

export async function memberRegister(payload: {
  name: string
  email: string
  password: string
  password_confirmation: string
}) {
  await ensureCsrf()
  const { data } = await api.post<{ user: AuthUser; token?: string }>(
    '/auth/member/register',
    payload,
  )
  if (data.token) setMemberToken(data.token)
  return data
}
