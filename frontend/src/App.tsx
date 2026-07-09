import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PublicLayout } from './components/layout/PublicLayout'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { ArticlesPage } from './pages/ArticlesPage'
import { ArticleDetailPage } from './pages/ArticleDetailPage'
import { AchievementsPage } from './pages/AchievementsPage'
import { AchievementDetailPage } from './pages/AchievementDetailPage'
import { ExtracurricularPage } from './pages/ExtracurricularPage'
import { DownloadsPage } from './pages/DownloadsPage'
import { MemberLoginPage } from './pages/MemberLoginPage'
import { MemberRegisterPage } from './pages/MemberRegisterPage'
import { MemberAccountPage } from './pages/MemberAccountPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import { ArticlesAdminPage } from './pages/admin/ArticlesAdminPage'
import { ArticleEditorPage } from './pages/admin/ArticleEditorPage'
import { ResourceListPage } from './pages/admin/ResourceListPage'
import { ResourceEditorPage } from './pages/admin/ResourceEditorPage'
import { SettingsAdminPage } from './pages/admin/SettingsAdminPage'
import { WelcomeAdminPage } from './pages/admin/WelcomeAdminPage'
import { ProfileContentAdminPage } from './pages/admin/ProfileContentAdminPage'
import { MediaGuidePage } from './pages/admin/MediaGuidePage'
import { MediaLibraryPage } from './pages/admin/MediaLibraryPage'
import { UsersAdminPage } from './pages/admin/UsersAdminPage'
import { RESOURCE_CONFIGS } from './admin/resourceConfigs'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function resourceRoutes(slug: keyof typeof RESOURCE_CONFIGS) {
  const config = RESOURCE_CONFIGS[slug]
  return (
    <>
      <Route path={slug} element={<ResourceListPage config={config} />} />
      <Route path={`${slug}/new`} element={<ResourceEditorPage config={config} />} />
      <Route path={`${slug}/:id/edit`} element={<ResourceEditorPage config={config} />} />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="profil" element={<ProfilePage />} />
            <Route path="artikel" element={<ArticlesPage />} />
            <Route path="artikel/:slug" element={<ArticleDetailPage />} />
            <Route path="prestasi" element={<AchievementsPage />} />
            <Route path="prestasi/:slug" element={<AchievementDetailPage />} />
            <Route path="ekstrakurikuler" element={<ExtracurricularPage />} />
            <Route path="aplikasi" element={<Navigate to="/ekstrakurikuler" replace />} />
            <Route path="download" element={<DownloadsPage />} />
            <Route path="akun" element={<MemberAccountPage />} />
          </Route>

          <Route path="/login" element={<MemberLoginPage />} />
          <Route path="/daftar" element={<MemberRegisterPage />} />
          <Route path="/register" element={<Navigate to="/daftar" replace />} />
          <Route path="/member/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />

            {/* Artikel — full page editor ala WordPress */}
            <Route path="articles" element={<ArticlesAdminPage />} />
            <Route path="articles/new" element={<ArticleEditorPage />} />
            <Route path="articles/:id/edit" element={<ArticleEditorPage />} />

            <Route path="welcome" element={<WelcomeAdminPage />} />
            <Route path="profile-content" element={<ProfileContentAdminPage />} />
            <Route path="media" element={<MediaLibraryPage />} />
            <Route path="media-guide" element={<MediaGuidePage />} />
            <Route path="users" element={<UsersAdminPage />} />
            <Route path="settings" element={<SettingsAdminPage />} />

            {/* Resource CRUD — list + halaman new/edit (bukan popup) */}
            {resourceRoutes('categories')}
            {resourceRoutes('menus')}
            {resourceRoutes('banners')}
            {resourceRoutes('services')}
            {resourceRoutes('contacts')}
            {resourceRoutes('quick-services')}
            {resourceRoutes('achievements')}
            {resourceRoutes('gallery')}
            {resourceRoutes('partners')}
            {resourceRoutes('ekstrakurikuler')}
            {resourceRoutes('downloads')}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
