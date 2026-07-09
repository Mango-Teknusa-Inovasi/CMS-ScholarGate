import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <a href="#main-content" className="skip-link">
        Lewati ke konten
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
