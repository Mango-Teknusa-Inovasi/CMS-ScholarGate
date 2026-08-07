import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'

/**
 * Ultra-smooth, hardware-accelerated page entrance transition for Inertia/React routes.
 * Eliminates layout flicker and double-blur delays.
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

  return (
    <motion.div
      key={location.pathname}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** @deprecated */
export function AnimatedOutlet({ className }: { className?: string }) {
  return <AnimatedPage className={className} />
}

export default AnimatedPage
