import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { easeOutExpo } from '../../lib/motion'

type Props = {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: Props) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      data-layer
      data-parallax="2"
      className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between"
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
    >
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-subtle">{description}</p>
        )}
      </div>
      {actions && (
        <motion.div
          className="flex shrink-0 flex-wrap items-center gap-2"
          initial={reduce ? false : { opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.06, ease: easeOutExpo }}
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  )
}
