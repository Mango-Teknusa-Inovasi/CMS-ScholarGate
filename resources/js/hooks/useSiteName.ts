import { usePage } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { api, type Settings } from '../lib/api'

/**
 * Hook to retrieve the dynamic school/institution name across the portal and CMS.
 * Prioritizes active DB settings -> Inertia app prop -> fallback to "Portal Resmi".
 * Eliminates any hardcoded brand/CMS vendor names in UI copy.
 */
export function useSiteName(): string {
  let appName = ''
  try {
    const page = usePage()
    appName = ((page.props as { app?: { name?: string } })?.app?.name || '').trim()
  } catch {
    // Outside Inertia context
  }

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Settings>('/settings/public')).data,
    staleTime: 60_000,
  })

  return settings?.site_name?.trim() || appName || 'Portal Resmi'
}
