import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  Eye,
  FileText,
  Image,
  Download,
  Tags,
  PenLine,
  LayoutTemplate,
  Users,
} from 'lucide-react'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { easeOutExpo, staggerContainer, staggerItem } from '../../lib/motion'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { AdminDashboardSkeleton } from '../../components/ui/Skeleton'

type Dashboard = {
  stats: {
    articles_published: number
    articles_draft: number
    categories: number
    banners_active: number
    downloads: number
    total_views: number
  }
  recent_articles: Array<{
    id: number
    title: string
    slug: string
    status: string
    views: number
    updated_at: string
    category?: { id: number; name: string } | null
  }>
}

const quickLinks = [
  {
    to: '/admin/articles/new',
    label: 'Tulis artikel',
    desc: 'Halaman editor penuh',
    icon: PenLine,
  },
  {
    to: '/admin/banners',
    label: 'Kelola banner',
    desc: 'Hero beranda',
    icon: LayoutTemplate,
  },
  {
    to: '/admin/welcome',
    label: 'Edit sambutan',
    desc: 'Home & profil',
    icon: FileText,
  },
  {
    to: '/admin/ekstrakurikuler',
    label: 'Ekstrakurikuler',
    desc: 'Kegiatan siswa',
    icon: Users,
  },
]

export function DashboardPage() {
  const reduce = useReducedMotion()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get<Dashboard>('/admin/dashboard')).data,
  })

  if (isLoading) {
    return <AdminDashboardSkeleton />
  }

  if (isError || !data) {
    return (
      <div className="rounded-[16px] border border-line bg-white p-8 text-center shadow-[var(--shadow-card)]">
        <p className="font-semibold text-ink">Gagal memuat dashboard</p>
        <p className="mt-1 text-sm text-subtle">Periksa koneksi internet Anda, lalu coba lagi.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-[12px] bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
        >
          Muat ulang
        </button>
      </div>
    )
  }

  const cards = [
    {
      label: 'Artikel terbit',
      value: data.stats.articles_published,
      icon: FileText,
      tone: 'bg-sky-50 text-sky-900 ring-1 ring-inset ring-sky-100',
      iconBg: 'bg-sky-100 text-sky-600',
    },
    {
      label: 'Draf',
      value: data.stats.articles_draft,
      icon: PenLine,
      tone: 'bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-100',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Total tayangan',
      value: data.stats.total_views,
      icon: Eye,
      tone: 'bg-violet-50 text-violet-950 ring-1 ring-inset ring-violet-100',
      iconBg: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Kategori',
      value: data.stats.categories,
      icon: Tags,
      tone: 'bg-teal-50 text-teal-950 ring-1 ring-inset ring-teal-100',
      iconBg: 'bg-teal-100 text-teal-600',
    },
    {
      label: 'Banner aktif',
      value: data.stats.banners_active,
      icon: Image,
      tone: 'bg-rose-50 text-rose-950 ring-1 ring-inset ring-rose-100',
      iconBg: 'bg-rose-100 text-rose-500',
    },
    {
      label: 'Berkas unduhan',
      value: data.stats.downloads,
      icon: Download,
      tone: 'bg-emerald-50 text-emerald-950 ring-1 ring-inset ring-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
  ]

  return (
    <div>
      <div data-layer>
        <AdminPageHeader
          title="Dashboard"
          description="Ringkasan konten portal. Kelola artikel, tampilan, dan data sekolah dari menu kiri."
          actions={
            <Link
              to="/admin/articles/new"
              className="inline-flex items-center gap-2 rounded-[12px] bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 active:scale-[0.98]"
            >
              <PenLine className="h-4 w-4" />
              Artikel baru
            </Link>
          }
        />
      </div>

      {/* Stats — muncul satu-satu */}
      <motion.div
        data-layer
        className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6"
        variants={staggerContainer}
        initial={reduce ? false : "hidden"}
        animate="show"
      >
        {cards.map((c) => (
          <motion.div
            key={c.label}
            variants={staggerItem}
            className={`rounded-[16px] p-3 sm:p-4 shadow-[var(--shadow-card)] ${c.tone}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium sm:text-sm">{c.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{c.value}</p>
              </div>
              <div className={`hidden h-8 w-8 shrink-0 items-center sm:flex justify-center rounded-xl ${c.iconBg}`}>
                <c.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-12" data-layer>
        {/* Recent articles */}
        <motion.section
          data-stagger-child
          className="min-w-0 xl:col-span-8 overflow-hidden rounded-[16px] border border-line bg-white shadow-[var(--shadow-card)]"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOutExpo }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-bold text-ink">Artikel terbaru</h2>
              <p className="text-xs text-subtle">Diubah paling akhir</p>
            </div>
            <Link
              to="/admin/articles"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Lihat semua
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {data.recent_articles.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-subtle">Belum ada artikel.</p>
              <Link
                to="/admin/articles/new"
                className="mt-3 inline-flex text-sm font-semibold text-brand"
              >
                Buat artikel pertama
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {data.recent_articles.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/admin/articles/${a.id}/edit`}
                    className="flex flex-col gap-2 px-5 py-4 transition hover:bg-page sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-semibold text-ink">{a.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
                        <span>{a.category?.name || 'Tanpa kategori'}</span>
                        <span className="text-line">·</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Eye className="h-3.5 w-3.5" />
                          {a.views}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <StatusBadge status={a.status} />
                      <span className="text-xs text-subtle">{formatDate(a.updated_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* Quick actions */}
        <motion.section
          data-stagger-child
          className="xl:col-span-4 rounded-[16px] border border-line bg-white p-5 shadow-[var(--shadow-card)]"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.28, ease: easeOutExpo }}
        >
          <h2 className="font-bold text-ink">Aksi cepat</h2>
          <p className="mt-1 text-xs text-subtle">Pintasan yang sering dipakai</p>
          <div className="mt-4 grid gap-2">
            {quickLinks.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="group flex items-center gap-3 rounded-[14px] border border-line bg-page px-3.5 py-3 transition hover:border-brand/25 hover:bg-brand-soft/40 active:scale-[0.99]"
              >
                <div className="hidden h-8 w-8 shrink-0 items-center sm:flex justify-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-line">
                  <q.icon className="h-4.5 w-4.5 h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink group-hover:text-brand-dark">
                    {q.label}
                  </p>
                  <p className="text-xs text-subtle">{q.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-[14px] bg-peach p-4">
            <p className="text-sm font-semibold text-ink">Tips</p>
            <p className="mt-1 text-xs leading-relaxed text-body">
              Gunakan editor artikel untuk menulis konten lengkap (gambar, tabel, video). Menu
              navigasi dan sambutan bisa diubah kapan saja tanpa menyentuh kode.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default DashboardPage
