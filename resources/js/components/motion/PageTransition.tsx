import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { useGsapParallaxPage } from '../../hooks/useGsapPageEnter'
import { easeOutExpo } from '../../lib/motion'

/**
 * Page shell + GSAP sequential parallax enter for Inertia navigations.
 */
export function AnimatedPage({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  const location = useLocation()
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isAdmin ? (
        <AdminRoute key={location.pathname + location.search} className={className}>
          {children}
        </AdminRoute>
      ) : (
        <ParallaxRoute key={location.pathname + location.search} className={className}>
          {children}
        </ParallaxRoute>
      )}
    </AnimatePresence>
  )
}

function AdminRoute({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: easeOutExpo }}
    >
      {children}
    </motion.div>
  )
}

/** @deprecated use AnimatedPage — kept for any remaining imports */
export function AnimatedOutlet({ className }: { className?: string }) {
  return <AnimatedPage className={className} />
}

function ParallaxRoute({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useGsapParallaxPage(true)

  return (
    <motion.div
      ref={ref}
      className={className}
      // Keep shell visible — GSAP owns per-section opacity (avoids full-page pop)
      initial={false}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        y: -12,
        filter: 'blur(3px)',
        transition: { duration: 0.2, ease: easeOutExpo },
      }}
      transition={{ duration: 0.2, ease: easeOutExpo }}
    >
      {children}
    </motion.div>
  )
}
