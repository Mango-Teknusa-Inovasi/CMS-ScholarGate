import '../css/app.css'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { StrictMode, type ComponentType, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FeedbackProvider } from './components/ui/FeedbackProvider'
import { PublicLayout } from './components/layout/PublicLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

const pages = import.meta.glob('./pages/**/*.tsx') as Record<
  string,
  () => Promise<{ default: ComponentType; layout?: (page: ReactNode) => ReactNode }>
>

const themePages = import.meta.glob('./themes/**/*.tsx') as Record<
  string,
  () => Promise<{ default: ComponentType; layout?: (page: ReactNode) => ReactNode }>
>

async function resolvePage(name: string, activeTheme: string = 'default'): Promise<ComponentType> {
  const candidates = name.startsWith('admin/')
    ? [`./pages/${name}.tsx`]
    : [
        `./themes/${activeTheme}/pages/${name}.tsx`,
        `./themes/default/pages/${name}.tsx`,
        `./pages/${name}.tsx`,
      ]

  for (const path of candidates) {
    const load = path.startsWith('./themes/') ? themePages[path] : pages[path]
    if (load) return (await load()).default
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
  'ErrorPage',
])

/** Admin CMS pages (not login) */
function isAdminPage(name: string) {
  return name.startsWith('admin/') && name !== 'admin/AdminLoginPage'
}

import { router } from '@inertiajs/react'

function getInitialActiveTheme(): string {
  try {
    const scriptEl = document.querySelector('script[data-page]')
    if (scriptEl?.textContent) {
      const page = JSON.parse(scriptEl.textContent)
      if (page?.props?.active_theme) {
        return page.props.active_theme
      }
    }
    const appEl = document.getElementById('app')
    if (appEl?.dataset?.page) {
      const page = JSON.parse(appEl.dataset.page)
      if (page?.props?.active_theme) {
        return page.props.active_theme
      }
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
  resolve: async (name) => {
    const activeTheme = getInitialActiveTheme()
    if (activeTheme !== 'default') {
      currentActiveTheme = activeTheme
    }
    const finalTheme = currentActiveTheme || activeTheme || 'default'

    const page = (await resolvePage(name, finalTheme)) as ComponentType & {
      layout?: (page: ReactNode) => ReactNode
    }

    if (!page.layout) {
      if (PUBLIC_LAYOUT_PAGES.has(name)) {
        page.layout = (p) => <PublicLayout>{p}</PublicLayout>
      } else if (isAdminPage(name)) {
        const { AdminLayout } = await import('./pages/admin/AdminLayout')
        page.layout = (p) => <AdminLayout>{p}</AdminLayout>
      }
    }

    return page
  },
  setup({ el, App, props }) {
    const app = (
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <MotionConfig reducedMotion="user">
            <FeedbackProvider>
              <App {...props} />
            </FeedbackProvider>
          </MotionConfig>
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
