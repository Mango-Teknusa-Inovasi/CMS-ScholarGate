import type { Transition, Variants } from 'motion/react'

/** Shared ease — soft, premium (not linear bounce) */
export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1]
export const easeInOutSoft: [number, number, number, number] = [0.4, 0, 0.2, 1]

export const springSoft = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 32,
  mass: 0.85,
}

export const springSnappy = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
  mass: 0.7,
}

export const fadeTransition: Transition = {
  duration: 0.38,
  ease: easeOutExpo,
}

/** Light shell only — real enter is GSAP stagger parallax */
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.28, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: easeInOutSoft },
  },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: easeOutExpo },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.45, ease: easeOutExpo },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOutExpo },
  },
}

/** Slower cascade — satu-satu */
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: easeOutExpo },
  },
}

/** Parallax-ish reveal layers */
export const parallaxLayer = (depth = 1): Variants => ({
  hidden: { opacity: 0, y: 24 + depth * 14, scale: 0.96 + depth * 0.005 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
})

export const accordionPanel: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.28, ease: easeInOutSoft },
  },
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.34, ease: easeOutExpo },
      opacity: { duration: 0.28, delay: 0.04 },
    },
  },
}

export const drawerVariants: Variants = {
  closed: { x: '-100%', transition: { duration: 0.28, ease: easeInOutSoft } },
  open: { x: 0, transition: { ...springSoft } },
}

export const overlayVariants: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.22 } },
}

export const navItemHover = {
  whileHover: { x: 2 },
  whileTap: { scale: 0.985 },
  transition: springSnappy,
}
