import axios from 'axios'

/**
 * Session/CSRF-first API client for Inertia monolith.
 * Same-origin cookies + XSRF; optional Bearer still supported for tokens.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

/** Fetch Sanctum CSRF cookie before login/mutating without prior session */
export async function ensureCsrf() {
  await axios.get('/sanctum/csrf-cookie', {
    withCredentials: true,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  })
}

// ── Types (shared with pages) ──────────────────────────────────────────

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

/** @deprecated session auth — kept for call sites that imported setAuthToken */
export function setAuthToken(_token: string | null) {
  // no-op: auth is cookie/session based
}

/** @deprecated */
export function getAuthToken() {
  return null
}
