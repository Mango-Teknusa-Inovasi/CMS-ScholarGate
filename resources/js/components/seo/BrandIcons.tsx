import { Head } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { api, type Settings } from '../../lib/api'
import { mediaUrl } from '../../lib/utils'

/**
 * Sync tab favicon / apple-touch from public settings (after logo upload).
 * Complements server-side links in app.blade.php for soft navigations.
 */
export function BrandIcons() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Settings>('/settings/public')).data,
    staleTime: 60_000,
  })

  const fav32 = mediaUrl(data?.favicon_path)
  const fav16 = mediaUrl(data?.favicon_16_path)
  const apple = mediaUrl(data?.apple_touch_icon_path)

  if (!fav32 && !fav16 && !apple) return null

  return (
    <Head>
      {fav32 && <link rel="icon" type="image/png" sizes="32x32" href={fav32} />}
      {fav16 && <link rel="icon" type="image/png" sizes="16x16" href={fav16} />}
      {fav32 && <link rel="shortcut icon" href={fav32} />}
      {apple && <link rel="apple-touch-icon" sizes="180x180" href={apple} />}
    </Head>
  )
}
