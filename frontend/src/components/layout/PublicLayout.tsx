import { Header } from './Header'
import { Footer } from './Footer'
import { AnimatedOutlet } from '../motion/PageTransition'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <a href="#main-content" className="skip-link">
        Lewati ke konten
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <AnimatedOutlet />
      </main>
      <Footer />
    </div>
  )
}
