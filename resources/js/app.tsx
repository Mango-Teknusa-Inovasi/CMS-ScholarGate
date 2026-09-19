import '../css/app.css'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { StrictMode, type ComponentType, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeedbackProvider } from './components/ui/FeedbackProvider'
import { PublicLayout } from './components/layout/PublicLayout'
import { AdminLayout } from './pages/admin/AdminLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const pages = import.meta.glob('./pages/**/*.tsx', { eager: true }) as Record<
  string,
  { default: ComponentType; layout?: (page: ReactNode) => ReactNode }
>

const themePages = import.meta.glob('./themes/**/*.tsx', { eager: true }) as Record<
  string,
  { default: ComponentType; layout?: (page: ReactNode) => ReactNode }
>

function resolvePage(name: string, activeTheme: string = 'default'): ComponentType {
  // Admin pages stay in ./pages/
  if (name.startsWith('admin/')) {
    const path = `./pages/${name}.tsx`
    if (pages[path]) {
      return pages[path].default
    }
  }

  // 1. Try active theme path: ./themes/{activeTheme}/pages/{name}.tsx
  const activePath = `./themes/${activeTheme}/pages/${name}.tsx`
  if (themePages[activePath]) {
    return themePages[activePath].default
  }

  // 2. Fallback to default theme path: ./themes/default/pages/{name}.tsx
  const defaultPath = `./themes/default/pages/${name}.tsx`
  if (themePages[defaultPath]) {
    return themePages[defaultPath].default
  }

  // 3. Fallback to legacy pages folder: ./pages/{name}.tsx
  const legacyPath = `./pages/${name}.tsx`
  if (pages[legacyPath]) {
    return pages[legacyPath].default
  }

  throw new Error(`Inertia page not found: ${name} (active theme: ${activeTheme})`)
}


/** Public portal pages that use PublicLayout shell */
const PUBLIC_LAYOUT_PAGES = new Set([
  'HomePage',
  'ProfilePage',
  'ArticlesPage',
  'ArticleDetailPage',
  'ArticlePreviewPage',
  'AchievementsPage',
  'AchievementDetailPage',
  'ExtracurricularPage',
  'DownloadsPage',
  'MemberAccountPage',
  'LegalPage',
])

/** Admin CMS pages (not login) */
function isAdminPage(name: string) {
  return name.startsWith('admin/') && name !== 'admin/AdminLoginPage'
}

import { router } from '@inertiajs/react'

function getInitialActiveTheme(): string {
  try {
    const el = document.getElementById('app')
    if (el?.dataset?.page) {
      const page = JSON.parse(el.dataset.page)
      return page?.props?.active_theme || 'default'
    }
  } catch {
    // ignore
  }
  return 'default'
}

let currentActiveTheme = getInitialActiveTheme()

router.on('navigate', (event) => {
  const pageTheme = (event.detail.page?.props as { active_theme?: string })?.active_theme
  if (pageTheme) {
    currentActiveTheme = pageTheme
  }
})

createInertiaApp({
  title: (title) => (title ? `${title}` : 'Portal Resmi'),
  resolve: (name) => {
    const activeTheme = currentActiveTheme || getInitialActiveTheme()

    const page = resolvePage(name, activeTheme) as ComponentType & {
      layout?: (page: ReactNode) => ReactNode
    }

    if (!page.layout) {
      if (PUBLIC_LAYOUT_PAGES.has(name)) {
        page.layout = (p) => <PublicLayout>{p}</PublicLayout>
      } else if (isAdminPage(name)) {
        page.layout = (p) => <AdminLayout>{p}</AdminLayout>
      }
    }

    return page
  },
  setup({ el, App, props }) {
    const app = (
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <FeedbackProvider>
            <App {...props} />
          </FeedbackProvider>
        </QueryClientProvider>
      </StrictMode>
    )

    if (el.hasChildNodes()) {
      hydrateRoot(el, app)
    } else {
      createRoot(el).render(app)
    }
  },
  progress: {
    color: '#0ea5e9',
    showSpinner: true,
  },
})
