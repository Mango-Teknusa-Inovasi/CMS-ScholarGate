import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

function collectTargets(root: HTMLElement): HTMLElement[] {
  let targets = Array.from(
    root.querySelectorAll<HTMLElement>('[data-layer], [data-animate]'),
  ).filter((el) => {
    // Never hide skeleton / loading UI
    if (el.getAttribute('aria-busy') === 'true') return false
    if (el.querySelector('[aria-busy="true"]')) return false
    if (el.querySelector('.skeleton')) return false
    return true
  })

  if (targets.length === 0) {
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('section, .page-hero-band, [data-admin-block]'),
    )
    if (sections.length >= 1) {
      targets = sections
    } else {
      targets = Array.from(root.children).filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE',
      )
      if (targets.length === 1 && targets[0].children.length > 1) {
        const nested = Array.from(targets[0].children).filter(
          (el): el is HTMLElement => el instanceof HTMLElement,
        )
        if (nested.length > 1) targets = nested
      }
    }
  }

  return targets.slice(0, 24)
}

/**
 * Reveal on scroll: blocks appear one-by-one as they enter the viewport.
 * Uses ScrollTrigger.batch so simultaneous entries still cascade.
 * Soft scrub parallax after each reveal.
 */
export function useGsapParallaxPage(enabled = true) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const location = useLocation()

  useLayoutEffect(() => {
    if (!enabled || reduce || !ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = ref.current
    const targets = collectTargets(root)
    if (targets.length === 0) return

    const revealed = new WeakSet<HTMLElement>()

    const ctx = gsap.context(() => {
      gsap.set(root, { opacity: 1 })
      gsap.set(targets, {
        opacity: 0,
        y: (i: number) => 44 + Math.min(i, 8) * 8,
        scale: 0.96,
        filter: 'blur(5px)',
        transformOrigin: '50% 20%',
        willChange: 'transform, opacity, filter',
      })

      ScrollTrigger.batch(targets, {
        start: 'top 90%',
        once: true,
        // interval: group elements entering near the same time
        interval: 0.12,
        batchMax: 6,
        onEnter: (batch) => {
          const els = batch.filter((el): el is HTMLElement => {
            if (!(el instanceof HTMLElement)) return false
            if (revealed.has(el)) return false
            revealed.add(el)
            return true
          })
          if (!els.length) return

          gsap.to(els, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.72,
            ease: 'power3.out',
            stagger: 0.11,
            overwrite: 'auto',
            onComplete: () => {
              els.forEach((el) => {
                gsap.set(el, { clearProps: 'filter,willChange' })

                const i = targets.indexOf(el)
                const custom = Number(el.dataset.parallax)
                const travel =
                  !Number.isNaN(custom) && custom > 0 ? custom : 4 + (Math.max(i, 0) % 4) * 2

                if (travel <= 0) return

                gsap.fromTo(
                  el,
                  { y: travel },
                  {
                    y: -travel * 3,
                    ease: 'none',
                    scrollTrigger: {
                      trigger: el,
                      start: 'top bottom',
                      end: 'bottom top',
                      scrub: 1.15,
                      invalidateOnRefresh: true,
                    },
                  },
                )
              })
            },
          })

          // Nested cards cascade when their parent batch enters
          els.forEach((el) => {
            const kids = el.querySelectorAll<HTMLElement>(
              '[data-stagger-child], .grid > a, .grid > div',
            )
            const childList = Array.from(kids).slice(0, 16)
            if (childList.length > 1) {
              gsap.fromTo(
                childList,
                { opacity: 0, y: 16 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.48,
                  stagger: 0.055,
                  ease: 'power2.out',
                  delay: 0.14,
                },
              )
            }
          })
        },
      })
    }, root)

    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((st) => {
        const trigger = st.trigger
        if (trigger instanceof Node && root.contains(trigger)) st.kill()
      })
    }
  }, [enabled, reduce, location.pathname, location.search])

  useEffect(() => {
    if (reduce) return
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', onResize)
    }
  }, [location.pathname, reduce])

  return ref
}

/** @deprecated */
export function useGsapPageEnter<T extends HTMLElement>(
  enabled = true,
  childSelector = '[data-animate]',
) {
  const ref = useRef<T | null>(null)
  const reduce = useReducedMotion()
  const location = useLocation()

  useEffect(() => {
    if (!enabled || reduce || !ref.current) return
    const root = ref.current
    const kids = root.querySelectorAll(childSelector)
    const targets = kids.length ? Array.from(kids) : [root]

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: (i: number) => 28 + i * 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 90%',
            once: true,
          },
        },
      )
    }, root)

    return () => ctx.revert()
  }, [enabled, reduce, childSelector, location.pathname])

  return ref
}
