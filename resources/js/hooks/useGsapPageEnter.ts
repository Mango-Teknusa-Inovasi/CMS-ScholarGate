import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

function collectTargets(root: HTMLElement): HTMLElement[] {
  let targets = Array.from(
    root.querySelectorAll<HTMLElement>('[data-layer], [data-animate], .bento-board'),
  ).filter((el) => {
    if (el.getAttribute('aria-busy') === 'true') return false
    if (el.querySelector('[aria-busy="true"]')) return false
    if (el.querySelector('.skeleton')) return false
    const parentLayer = el.parentElement?.closest('[data-layer], [data-animate], .bento-board')
    if (parentLayer && root.contains(parentLayer) && parentLayer !== el) return false
    return true
  })

  targets = Array.from(new Set(targets))

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
 * Sequential section reveal + light scroll parallax.
 * Each [data-layer] / .bento-board enters one-by-one.
 * Re-binds when async content (e.g. home API) mounts boards later.
 */
export function useGsapParallaxPage(enabled = true) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const location = useLocation()
  const boundSig = useRef('')

  useLayoutEffect(() => {
    if (!enabled || reduce || !ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = ref.current
    let cancelled = false
    let ctx: gsap.Context | null = null
    let debounceTimer = 0

    const killLocalTriggers = () => {
      ctx?.revert()
      ctx = null
      ScrollTrigger.getAll().forEach((st) => {
        const trigger = st.trigger
        if (trigger instanceof Node && root.contains(trigger)) st.kill()
      })
    }

    const setup = (force = false) => {
      if (cancelled || !ref.current) return
      const targets = collectTargets(root)
      const sig = targets.map((t) => `${t.className}:${t.offsetTop}`).join('|')
      if (!force && sig === boundSig.current && targets.length > 0) return
      if (targets.length === 0) return

      boundSig.current = sig
      killLocalTriggers()

      const revealed = new WeakSet<HTMLElement>()

      ctx = gsap.context(() => {
        gsap.set(root, { opacity: 1 })
        gsap.set(targets, {
          opacity: 0,
          y: (i: number) => 56 + Math.min(i, 6) * 10,
          scale: 0.97,
          filter: 'blur(6px)',
          transformOrigin: '50% 12%',
          willChange: 'transform, opacity, filter',
        })

        const inView: HTMLElement[] = []
        const deferred: HTMLElement[] = []
        const vh = window.innerHeight
        targets.forEach((el) => {
          const top = el.getBoundingClientRect().top
          if (top < vh * 0.92) inView.push(el)
          else deferred.push(el)
        })

        const revealEl = (el: HTMLElement, delay: number) => {
          if (revealed.has(el)) return
          revealed.add(el)
          const i = targets.indexOf(el)

          gsap.to(el, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.78,
            delay,
            ease: 'power3.out',
            overwrite: 'auto',
            onComplete: () => {
              gsap.set(el, { clearProps: 'filter,willChange' })
              attachParallax(el, i)
              cascadeChildren(el, 0.08)
            },
          })
        }

        // Above the fold: clear cascade (hero → sambutan → articles → …)
        inView.forEach((el, idx) => {
          revealEl(el, idx * 0.2)
        })

        // Below fold: one ScrollTrigger per board
        deferred.forEach((el) => {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 88%',
            once: true,
            onEnter: () => revealEl(el, 0),
          })
        })
      }, root)

      requestAnimationFrame(() => ScrollTrigger.refresh())
    }

    setup(true)

    // Home (and similar) swap skeleton → real boards after fetch
    const mo = new MutationObserver(() => {
      window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => setup(false), 80)
    })
    mo.observe(root, { childList: true, subtree: true })

    const late = window.setTimeout(() => setup(false), 400)

    return () => {
      cancelled = true
      mo.disconnect()
      window.clearTimeout(debounceTimer)
      window.clearTimeout(late)
      boundSig.current = ''
      killLocalTriggers()
    }
  }, [enabled, reduce, location.pathname, location.search])

  useEffect(() => {
    if (reduce) return
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 500)
    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', onResize)
    }
  }, [location.pathname, reduce])

  return ref
}

function attachParallax(el: HTMLElement, index: number) {
  const custom = Number(el.dataset.parallax)
  const travel =
    !Number.isNaN(custom) && custom >= 0 ? custom : 5 + (Math.max(index, 0) % 4) * 2.5
  if (travel <= 0) return

  gsap.fromTo(
    el,
    { y: travel },
    {
      y: -travel * 2.2,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    },
  )
}

function cascadeChildren(el: HTMLElement, baseDelay: number) {
  const kids = el.querySelectorAll<HTMLElement>(
    ':scope > [data-stagger-child], :scope > a, :scope > div, :scope > article, :scope > section',
  )
  const childList = Array.from(kids)
    .filter((k) => !k.hasAttribute('data-layer') && !k.classList.contains('bento-board'))
    .slice(0, 14)
  if (childList.length < 2) return

  gsap.fromTo(
    childList,
    { opacity: 0.25, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.52,
      stagger: 0.065,
      ease: 'power2.out',
      delay: baseDelay,
    },
  )
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
          stagger: 0.12,
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
