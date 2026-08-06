import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { AnimatedPage } from '../motion/PageTransition'
import { BrandIcons } from '../seo/BrandIcons'

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <BrandIcons />
      <a href="#main-content" className="skip-link">
        Lewati ke konten
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <AnimatedPage>{children}</AnimatedPage>
      </main>
      <Footer />
    </div>
  )
}

export default PublicLayout
