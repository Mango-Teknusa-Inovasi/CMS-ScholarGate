import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocation, useOutlet } from 'react-router-dom'
import { useGsapParallaxPage } from '../../hooks/useGsapPageEnter'
import { easeOutExpo } from '../../lib/motion'

/**
 * Route shell + GSAP sequential parallax enter.
 * Blocks with [data-layer] / section appear one-by-one with depth.
 */
export function AnimatedOutlet({ className }: { className?: string }) {
  const location = useLocation()
  const outlet = useOutlet()
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{outlet}</div>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <ParallaxRoute key={location.pathname + location.search} className={className}>
        {outlet}
      </ParallaxRoute>
    </AnimatePresence>
  )
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        y: -16,
        filter: 'blur(4px)',
        transition: { duration: 0.22, ease: easeOutExpo },
      }}
      transition={{ duration: 0.22, ease: easeOutExpo }}
    >
      {children}
    </motion.div>
  )
}
