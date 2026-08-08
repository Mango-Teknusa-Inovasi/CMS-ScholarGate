import '../css/app.css'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { StrictMode, type ComponentType, type ReactNode } from 'react'
import { HelmetProvider } from 'react-helmet-async'
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

function resolvePage(name: string): ComponentType {
  const path = `./pages/${name}.tsx`
  const mod = pages[path]
  if (!mod) {
    throw new Error(`Inertia page not found: ${name} (looked for ${path})`)
  }
  const Component = mod.default || (Object.values(mod)[0] as ComponentType)
  if (!Component) {
    throw new Error(`Inertia page has no valid component export: ${name}`)
  }
  return Component
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

createInertiaApp({
  title: (title) => (title ? `${title}` : 'Scholargate'),
  resolve: (name) => {
    const page = resolvePage(name) as ComponentType & {
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
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <FeedbackProvider>
              <App {...props} />
            </FeedbackProvider>
          </QueryClientProvider>
        </HelmetProvider>
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
