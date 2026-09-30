import { Link, Head } from '@inertiajs/react'
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Home,
  Lock,
  RefreshCw,
  Search,
  ServerCrash,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { ClassicLayout } from '../layout/ClassicLayout'
import { useSiteName } from '../../../hooks/useSiteName'
import type { ReactNode } from 'react'

type Props = {
  status?: number
  message?: string
}

type ErrorMeta = {
  code: number
  title: string
  subtitle: string
  description: string
  icon: LucideIcon
  badgeColor: string
  actionLabel?: string
  actionHref?: string
  isReload?: boolean
}

const errorConfigs: Record<number, ErrorMeta> = {
  404: {
    code: 404,
    title: 'Halaman Tidak Ditemukan',
    subtitle: 'Halaman berita atau portal yang Anda cari tidak tersedia.',
    description:
      'Tautan yang Anda tuju mungkin telah dihapus, diubah namanya, atau sementara tidak dapat diakses. Silakan kembali ke beranda warta sekolah.',
    icon: Search,
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300',
    actionLabel: 'Kembali ke Beranda Warta',
    actionHref: '/',
  },
  403: {
    code: 403,
    title: 'Akses Ditolak',
    subtitle: 'Area terbatas portal sekolah.',
    description:
      'Halaman ini memerlukan kewenangan khusus. Silakan masuk dengan akun yang terdaftar untuk mengakses halaman ini.',
    icon: Lock,
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
    actionLabel: 'Login Portal',
    actionHref: '/login',
  },
  419: {
    code: 419,
    title: 'Sesi Halaman Berakhir',
    subtitle: 'Masa berlaku formulir atau navigasi telah habis.',
    description:
      'Halaman memerlukan pengesahan ulang token CSRF. Silakan tekan tombol di bawah untuk memuat ulang formulir.',
    icon: Clock,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
    actionLabel: 'Muat Ulang Halaman',
    isReload: true,
  },
  503: {
    code: 503,
    title: 'Pemeliharaan Portal Warta',
    subtitle: 'Pemberitahuan perawatan berkala.',
    description:
      'Portal warta berita sekolah sedang meningkatkan infrastruktur server. Silakan coba kembali beberapa saat lagi.',
    icon: Wrench,
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
    actionLabel: 'Coba Lagi',
    isReload: true,
  },
  500: {
    code: 500,
    title: 'Kendala Server Internal',
    subtitle: 'Sistem mengalami masalah penanganan data.',
    description:
      'Terjadi kendala pada server internal kami. Petugas administrasi jaringan telah menerima laporan dan sedang memperbaikinya.',
    icon: ServerCrash,
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
    actionLabel: 'Kembali ke Beranda',
    actionHref: '/',
  },
}

export default function ErrorPage({ status = 404, message }: Props) {
  const siteName = useSiteName()
  const meta = errorConfigs[status] || {
    code: status,
    title: 'Terjadi Galat',
    subtitle: message || 'Terjadi kesalahan pada sistem.',
    description: 'Silakan kembali ke halaman utama portal.',
    icon: AlertCircle,
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
    actionLabel: 'Kembali ke Beranda',
    actionHref: '/',
  }

  const Icon = meta.icon

  return (
    <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:py-16">
      <Head title={`${meta.code} - ${meta.title} | ${siteName}`} />

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Icon className="h-8 w-8" />
          </div>

          <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${meta.badgeColor}`}>
            KODE GALAT {meta.code}
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {meta.title}
          </h1>

          <p className="mt-2 text-base font-medium text-slate-700 dark:text-slate-300">
            {meta.subtitle}
          </p>

          <div className="my-6 max-w-lg rounded-lg border-l-4 border-sky-500 bg-sky-50/50 p-4 text-left text-sm text-slate-600 dark:border-sky-400 dark:bg-sky-950/30 dark:text-slate-300">
            {message || meta.description}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {meta.isReload ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                {meta.actionLabel || 'Muat Ulang Halaman'}
              </button>
            ) : (
              <Link
                href={meta.actionHref || '/'}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 active:scale-95"
              >
                <Home className="h-4 w-4" />
                {meta.actionLabel || 'Kembali ke Beranda Warta'}
              </Link>
            )}

            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

ErrorPage.layout = (page: ReactNode) => <ClassicLayout>{page}</ClassicLayout>
