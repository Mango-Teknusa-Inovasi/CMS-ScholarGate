import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { safeHref } from '../../lib/sanitize'
import { cn } from '../../lib/utils'

export type SiteMenuItem = {
  id: number
  label: string
  url: string
  open_in_new_tab?: boolean
  children?: SiteMenuItem[]
}

const activeClass = 'bg-brand-soft font-semibold text-brand-dark dark:bg-sky-950 dark:text-sky-200'
const linkClass = 'inline-flex min-h-11 items-center min-w-0 rounded-xl px-3 py-2 text-sm font-medium text-body hover:bg-muted dark:text-slate-200 dark:hover:bg-slate-800 transition-colors'

function matchesPath(href: string, pathname: string) {
  const path = href.split(/[?#]/)[0]
  return path === pathname || (path !== '/' && pathname.startsWith(`${path}/`))
}

function MenuLink({ item, pathname, hash, exact = false, onNavigate, className }: {
  item: SiteMenuItem
  pathname: string
  hash: string
  exact?: boolean
  onNavigate?: () => void
  className?: string
}) {
  const href = safeHref(item.url)
  if (!href || href === '#') return <span className={cn(className, 'text-subtle')}>{item.label}</span>
  const internal = href.startsWith('/') && !href.startsWith('//')
  const [targetPath, targetHash = ''] = href.split('#')
  const current = internal && (exact
    ? targetPath.split('?')[0] === pathname && (targetHash ? `#${targetHash}` : '') === hash
    : matchesPath(href, pathname))
  const classes = cn(className, current && activeClass)

  // Same-page anchors use native navigation so scrolling and hash history stay in sync.
  if (internal && !item.open_in_new_tab && !(targetHash && targetPath === pathname)) {
    return <Link to={href} aria-current={current ? 'page' : undefined} onClick={onNavigate} className={classes}>{item.label}</Link>
  }
  return (
    <a href={href} aria-current={current ? (targetHash ? 'location' : 'page') : undefined}
      target={item.open_in_new_tab ? '_blank' : undefined}
      rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
      onClick={onNavigate} className={classes}>{item.label}</a>
  )
}

export function SiteNavItem({ item, mobile = false, onNavigate }: {
  item: SiteMenuItem
  mobile?: boolean
  onNavigate?: () => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const location = useLocation()
  const [hash, setHash] = useState(() => typeof window === 'undefined' ? location.hash : window.location.hash)
  useEffect(() => {
    setOpen(false)
    setHash(window.location.hash)
    const onHashChange = () => { setHash(window.location.hash); setOpen(false) }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [location.pathname, location.hash])
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  const navigate = () => { setOpen(false); onNavigate?.() }
  const children = item.children ?? []
  const parentHref = safeHref(item.url)
  const entries = parentHref && parentHref !== '#' && !children.some((child) => child.url === item.url)
    ? [{ ...item, label: `Lihat ${item.label}`, children: undefined }, ...children]
    : children
  const active = [item, ...children].some((entry) => {
    const href = safeHref(entry.url)
    return href?.startsWith('/') && !href.startsWith('//') && matchesPath(href, location.pathname)
  })

  return (
    <div ref={root} className="relative min-w-0"
      onMouseEnter={() => { if (!mobile && children.length) setOpen(true) }}
      onMouseLeave={() => { if (!mobile && children.length) setOpen(false) }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation()
          setOpen(false)
          trigger.current?.focus()
        }
      }}>
      {children.length ? (
        <button ref={trigger} type="button" aria-label={`Submenu ${item.label}`}
          aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
          className={cn(linkClass, 'inline-flex items-center gap-1.5', mobile ? 'w-full justify-between' : '', active && activeClass)}>
          <span>{item.label}</span>
          <ChevronDown aria-hidden className={cn('h-3.5 w-3.5 shrink-0 opacity-70 transition-transform', open && 'rotate-180')} />
        </button>
      ) : (
        <MenuLink item={item} pathname={location.pathname} hash={hash} onNavigate={navigate} className={cn(linkClass, mobile && 'w-full')} />
      )}
      {!!children.length && open && (
        <div id={id} className={cn('space-y-1 border-line dark:border-slate-700',
          mobile ? 'ml-3 mt-1 border-l pl-2' : 'absolute left-0 top-full z-30 mt-1 min-w-48 rounded-xl border bg-white p-1.5 shadow-lg dark:bg-slate-900')}>
          {entries.map((child) => (
            <MenuLink key={child.id} item={child} pathname={location.pathname} hash={hash} exact onNavigate={navigate}
              className="block whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-body hover:bg-muted dark:text-slate-200 dark:hover:bg-slate-800" />
          ))}
        </div>
      )}
    </div>
  )
}
