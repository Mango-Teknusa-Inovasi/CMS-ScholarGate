import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, type Achievement } from '../lib/api'
import { cn, formatDate, softMediaClass } from '../lib/utils'
import { Badge } from '../components/ui/Badge'
import { PageSkeleton } from '../components/ui/Skeleton'
import { SafeHtml } from '../components/ui/SafeHtml'

export function AchievementDetailPage() {
  const { slug } = useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['achievement', slug],
    queryFn: async () => (await api.get<Achievement>(`/achievements/${slug}`)).data,
    enabled: !!slug,
  })

  if (isLoading) {
    return <PageSkeleton />
  }
  if (isError || !data) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-red-500">Prestasi tidak ditemukan.</p>
        <Link to="/prestasi" className="mt-3 inline-block text-brand">Kembali</Link>
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <p className="mb-4 text-sm text-subtle">
        <Link to="/prestasi" className="hover:text-brand">Prestasi</Link> / Detail
      </p>
      {data.badge_label && <Badge color="#F59E0B" className="mb-3">{data.badge_label}</Badge>}
      <h1 className="max-w-3xl text-3xl font-bold text-ink">{data.title}</h1>
      <p className="mt-2 text-sm text-subtle">{formatDate(data.achieved_at)}</p>
      <div className={cn('my-8 aspect-[16/9] max-w-4xl rounded-[16px]', softMediaClass(2))} />
      <p className="max-w-3xl text-lg text-body">{data.excerpt}</p>
      <SafeHtml
        className="prose-article mt-6 max-w-3xl"
        html={(data as Achievement & { body?: string }).body}
      />
    </div>
  )
}
