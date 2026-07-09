import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { easeOutExpo, fadeUp, scaleIn, staggerContainer, staggerItem } from '../../lib/motion'
import { cn } from '../../lib/utils'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  /** fade-up (default) | fade | scale | parallax */
  variant?: 'up' | 'fade' | 'scale' | 'parallax'
  once?: boolean
  amount?: number
  /** Parallax depth 1–5 (higher = more travel) */
  depth?: number
} & Omit<HTMLMotionProps<'div'>, 'children' | 'variants'>

export function Reveal({
  children,
  className,
  delay = 0,
  variant = 'parallax',
  once = true,
  amount = 0.15,
  depth = 2,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const yParallax = useTransform(scrollYProgress, [0, 1], [depth * 18, depth * -18])

  const baseVariants =
    variant === 'scale'
      ? scaleIn
      : variant === 'fade'
        ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
        : fadeUp

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={variant === 'parallax' ? { y: yParallax } : undefined}
      variants={baseVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, ease: easeOutExpo, delay }}
      data-layer
      data-parallax={depth}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

type StaggerProps = {
  children: ReactNode
  className?: string
  once?: boolean
}

export function Stagger({ children, className, once = true }: StaggerProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div className={cn(className)} variants={staggerItem} data-stagger-child>
      {children}
    </motion.div>
  )
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: easeOutExpo, delay }}
      data-layer
    >
      {children}
    </motion.div>
  )
}
