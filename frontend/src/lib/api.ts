import axios from 'axios'
import { ADMIN_TOKEN_KEY, MEMBER_TOKEN_KEY } from './auth'

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})


function isAdminContext(url: string): boolean {
  const path = String(url || '')
  // API admin
  if (path.includes('/admin') || path.includes('/auth/admin')) return true
  // Saat di SPA admin, /auth/me & logout harus pakai token admin
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return true
  }
  return false
}

/**
 * Bearer token:
 * - Konteks admin (path /admin atau API admin) → admin token
 * - Portal → member token, fallback admin
 * - Header Authorization eksplisit menang
 */
api.interceptors.request.use((config) => {
  if (config.headers?.Authorization) {
    return config
  }

  const url = String(config.url || '')
  const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY)
  const memberToken = localStorage.getItem(MEMBER_TOKEN_KEY)

  if (isAdminContext(url) && adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
  } else if (!isAdminContext(url) && memberToken) {
    config.headers.Authorization = `Bearer ${memberToken}`
  } else if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
  } else if (memberToken) {
    config.headers.Authorization = `Bearer ${memberToken}`
  }

  return config
})

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  else localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export function getAuthToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

/** @deprecated */
export async function ensureCsrf() {
  return Promise.resolve()
}

export type Settings = Record<string, string>

export type Category = {
  id: number
  name: string
  slug: string
  color: string
  articles_count?: number
}

export type Article = {
  id: number
  title: string
  slug: string
  excerpt?: string
  body?: string
  cover_path?: string | null
  status: string
  is_featured: boolean
  views: number
  published_at?: string
  meta_title?: string | null
  meta_description?: string | null
  focus_keyword?: string | null
  faq_items?: Array<{ question: string; answer: string }> | null
  category?: Category | null
  author?: { id: number; name: string } | null
  tags?: Array<{ id: number; name: string; slug?: string }> | null
}

export type Banner = {
  id: number
  title: string
  subtitle?: string
  image_path?: string | null
  cta_label?: string
  cta_url?: string
}

export type ServiceItem = {
  id: number
  title: string
  description?: string
  icon: string
  color: string
  link_url?: string
}

export type WelcomeBlock = {
  id: number
  key: string
  title: string
  body?: string
  image_path?: string | null
  badge_left?: string
  badge_right?: string
  chat_label?: string
}

export type Achievement = {
  id: number
  title: string
  slug: string
  excerpt?: string
  cover_path?: string | null
  badge_label?: string
  is_featured: boolean
  achieved_at?: string
}

export type GalleryItem = {
  id: number
  title?: string
  image_path?: string | null
  caption?: string
}

export type Partner = {
  id: number
  name: string
  logo_path?: string | null
  url?: string
}

export type ContactInfo = {
  id: number
  type: string
  label: string
  value: string
  link_url?: string
  icon?: string
}

export type QuickService = {
  id: number
  title: string
  description?: string
  icon: string
  color: string
  link_url?: string
  link_label?: string
}

export type HomePayload = {
  settings: Settings
  banners: Banner[]
  welcome: WelcomeBlock | null
  services: ServiceItem[]
  articles: Article[]
  achievements: Achievement[]
  gallery: GalleryItem[]
  partners: Partner[]
}
