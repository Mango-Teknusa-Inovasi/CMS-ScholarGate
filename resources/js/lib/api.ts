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

api.interceptors.request.use((config) => {
  const isAdminRoute =
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) ||
    (config.url && config.url.startsWith('/admin'))
  const adminToken = localStorage.getItem('scholargate_admin_token')
  const memberToken = localStorage.getItem('scholargate_member_token')

  const token = isAdminRoute
    ? adminToken && adminToken !== 'session'
      ? adminToken
      : null
    : adminToken && adminToken !== 'session'
      ? adminToken
      : memberToken

  if (token && token !== 'session') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const isAdminRoute =
        (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) ||
        (error.config?.url && error.config.url.startsWith('/admin'))
      if (isAdminRoute) {
        localStorage.removeItem('scholargate_admin_token')
      } else {
        localStorage.removeItem('scholargate_member_token')
      }
    }
    return Promise.reject(error)
  },
)

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
  id: string | number
  name: string
  slug: string
  color: string
  articles_count?: number
}

export type Article = {
  id: string | number
  title: string
  slug: string
  excerpt?: string
  body?: string
  cover_path?: string | null
  cover_url?: string | null
  status: string
  is_featured: boolean
  views: number
  published_at?: string
  meta_title?: string | null
  meta_description?: string | null
  focus_keyword?: string | null
  faq_items?: Array<{ question: string; answer: string }> | null
  category?: Category | null
  author?: { id: string | number; name: string } | null
  tags?: Array<{ id: string | number; name: string; slug?: string }> | null
}

export type Banner = {
  id: string | number
  title: string
  subtitle?: string
  image_path?: string | null
  image_url?: string | null
  cta_label?: string
  cta_url?: string
}

export type ServiceItem = {
  id: string | number
  title: string
  description?: string
  icon: string
  color: string
  link_url?: string
  image_url?: string | null
}

export type WelcomeBlock = {
  id: string | number
  key: string
  title: string
  body?: string
  image_path?: string | null
  image_url?: string | null
  badge_left?: string
  badge_right?: string
  chat_label?: string
}

export type Achievement = {
  id: string | number
  title: string
  slug: string
  excerpt?: string
  cover_path?: string | null
  cover_url?: string | null
  badge_label?: string
  is_featured: boolean
  achieved_at?: string
}

export type GalleryItem = {
  id: string | number
  title?: string
  image_path?: string | null
  image_url?: string | null
  caption?: string
}

export type Partner = {
  id: string | number
  name: string
  logo_path?: string | null
  logo_url?: string | null
  url?: string
}

export type ContactInfo = {
  id: string | number
  type: string
  label: string
  value: string
  link_url?: string
  icon?: string
}

export type QuickService = {
  id: string | number
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
