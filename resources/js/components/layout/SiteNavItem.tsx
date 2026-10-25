import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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

function MenuLink({ item, onNavigate, className }: { item: SiteMenuItem; onNavigate?: () => void; className?: string }) {
  const href = safeHref(item.url)
  if (!href || href === '#') return <span className={cn(className, 'text-subtle')}>{item.label}</span>
  if (href.startsWith('/') && !href.startsWith('//') && !item.open_in_new_tab) {
    return <NavLink to={href} end={href === '/'} onClick={onNavigate} className={({ isActive }) => cn(className, isActive && 'bg-brand-soft font-semibold text-brand-dark dark:bg-sky-950 dark:text-sky-200')}>{item.label}</NavLink>
  }
  return <a href={href} target={item.open_in_new_tab ? '_blank' : undefined} rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined} onClick={onNavigate} className={className}>{item.label}</a>
}

export function SiteNavItem({ item, mobile = false, onNavigate }: { item: SiteMenuItem; mobile?: boolean; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  const navigate = () => { setOpen(false); onNavigate?.() }
  return (
    <div ref={root} className="relative min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); trigger.current?.focus() }
    }}>
      <div className="flex items-center">
        <MenuLink item={item} onNavigate={navigate} className={cn('block min-w-0 rounded-xl px-3 py-3 text-sm font-medium text-body hover:bg-muted dark:text-slate-200 dark:hover:bg-slate-800', mobile && 'flex-1')} />
        {!!item.children?.length && <button ref={trigger} type="button" aria-label={`Submenu ${item.label}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-body hover:bg-muted dark:text-slate-200 dark:hover:bg-slate-800"><ChevronDown aria-hidden className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} /></button>}
      </div>
      {!!item.children?.length && open && <div id={id} className={cn('space-y-1 border-line dark:border-slate-700', mobile ? 'ml-4 border-l pl-2' : 'absolute left-0 top-full z-30 w-60 rounded-2xl border bg-white p-2 shadow-lg dark:bg-slate-900')}>
        {item.children.map((child) => <MenuLink key={child.id} item={child} onNavigate={navigate} className="block rounded-lg px-3 py-3 text-sm text-body hover:bg-muted dark:text-slate-200 dark:hover:bg-slate-800" />)}
      </div>}
    </div>
  )
}
