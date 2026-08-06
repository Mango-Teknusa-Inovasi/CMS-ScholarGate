/**
 * react-router-dom → Inertia compatibility shim.
 * Allows existing pages/components to keep imports while routing via Inertia.
 */
import {
  Link as InertiaLink,
  router,
  usePage,
  type InertiaLinkProps,
} from '@inertiajs/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'

type NavigateOptions = {
  replace?: boolean
  state?: unknown
}

type LocationShape = {
  pathname: string
  search: string
  hash: string
  state: unknown
  key: string
}

function parseUrl(url: string): LocationShape {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    return {
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      state: null,
      key: url,
    }
  } catch {
    return { pathname: url || '/', search: '', hash: '', state: null, key: url || '/' }
  }
}

/** Inertia Link with react-router-dom-like `to` prop */
export function Link({
  to,
  href,
  children,
  className,
  style,
  onClick,
  replace,
  target,
  rel,
  title,
  ...rest
}: {
  to?: string
  href?: string
  children?: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  replace?: boolean
  target?: string
  rel?: string
  title?: string
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'>) {
  const destination = to ?? href ?? '#'
  const isHashOnly = destination.startsWith('#')
  const isExternal =
    /^(https?:|mailto:|tel:)/i.test(destination) ||
    destination.startsWith('//') ||
    target === '_blank'

  if (isHashOnly || isExternal) {
    return (
      <a
        href={destination}
        className={className}
        style={style}
        onClick={onClick}
        target={target}
        rel={rel}
        title={title}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <InertiaLink
      href={destination}
      className={className}
      style={style as InertiaLinkProps['style']}
      onClick={onClick as InertiaLinkProps['onClick']}
      preserveScroll={false}
      {...(replace ? { preserveState: false } : {})}
      target={target}
      rel={rel}
      title={title}
    >
      {children}
    </InertiaLink>
  )
}

type NavLinkClassName =
  | string
  | ((args: { isActive: boolean; isPending: boolean }) => string | undefined)

export function NavLink({
  to,
  end,
  className,
  children,
  onClick,
  ...rest
}: {
  to: string
  end?: boolean
  className?: NavLinkClassName
  children?: ReactNode | ((args: { isActive: boolean }) => ReactNode)
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}) {
  const page = usePage()
  const current = parseUrl(page.url).pathname
  const targetPath = to.split('?')[0].split('#')[0] || '/'
  const isActive = end
    ? current === targetPath
    : current === targetPath || (targetPath !== '/' && current.startsWith(targetPath + '/'))

  const resolvedClass =
    typeof className === 'function' ? className({ isActive, isPending: false }) : className

  const content = typeof children === 'function' ? children({ isActive }) : children

  return (
    <Link to={to} className={resolvedClass} onClick={onClick} {...rest}>
      {content}
    </Link>
  )
}

export function useNavigate() {
  return useCallback((to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      if (to === -1) window.history.back()
      else if (to === 1) window.history.forward()
      return
    }
    router.visit(to, {
      replace: options?.replace,
    })
  }, [])
}

export function useLocation(): LocationShape {
  const page = usePage()
  return useMemo(() => parseUrl(page.url), [page.url])
}

type PageParams = Record<string, string | undefined>

/**
 * Route params from Inertia props (`params` or top-level slug/id/token).
 */
export function useParams<T extends PageParams = PageParams>(): T {
  const page = usePage<{
    params?: PageParams
    slug?: string
    id?: string | number
    token?: string
  }>()

  return useMemo(() => {
    const p = page.props
    if (p.params && typeof p.params === 'object') {
      return p.params as T
    }
    const out: PageParams = {}
    if (p.slug != null) out.slug = String(p.slug)
    if (p.id != null) out.id = String(p.id)
    if (p.token != null) out.token = String(p.token)
    return out as T
  }, [page.props])
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const page = usePage()
  const [params, setLocal] = useState(() => parseUrl(page.url).search)

  useEffect(() => {
    setLocal(parseUrl(page.url).search)
  }, [page.url])

  const searchParams = useMemo(() => new URLSearchParams(params.startsWith('?') ? params.slice(1) : params), [params])

  const setParams = useCallback(
    (next: URLSearchParams | Record<string, string>) => {
      const sp = next instanceof URLSearchParams ? next : new URLSearchParams(next)
      const qs = sp.toString()
      const pathname = parseUrl(page.url).pathname
      const url = qs ? `${pathname}?${qs}` : pathname
      setLocal(qs ? `?${qs}` : '')
      router.get(url, {}, { preserveState: true, preserveScroll: true, replace: true })
    },
    [page.url],
  )

  return [searchParams, setParams]
}

/** Nested route outlet — Inertia uses layout wrappers instead */
const OutletContext = createContext<ReactNode>(null)

export function Outlet() {
  return useContext(OutletContext)
}

export function OutletProvider({ children, outlet }: { children: ReactNode; outlet: ReactNode }) {
  return <OutletContext.Provider value={outlet}>{children}</OutletContext.Provider>
}

/** No-ops / stubs for BrowserRouter patterns (Inertia owns history) */
export function BrowserRouter({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function Routes({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Route(_props: Record<string, unknown>) {
  return null
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  useEffect(() => {
    router.visit(to, { replace: replace ?? true })
  }, [to, replace])
  return null
}

export { router }
