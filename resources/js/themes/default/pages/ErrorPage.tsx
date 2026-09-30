import { Link } from '@inertiajs/react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Home,
  Lock,
  RefreshCw,
  Search,
  ServerCrash,
  ShieldAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useSiteName } from '../../../hooks/useSiteName'
import { BentoEyebrow } from '../../../components/ui/Bento'
import { Head } from '@inertiajs/react'

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
    subtitle: 'Oops! Halaman yang Anda cari tampaknya telah dipindahkan atau belum pernah ada.',
    description:
      'Periksa kembali alamat URL yang Anda masukkan, atau gunakan navigasi di bawah untuk kembali ke beranda portal sekolah.',
    icon: Search,
    badgeColor: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    actionLabel: 'Kembali ke Beranda',
    actionHref: '/',
  },
  403: {
    code: 403,
    title: 'Akses Ditolak',
    subtitle: 'Maaf, Anda tidak memiliki hak akses untuk membuka halaman ini.',
    description:
      'Halaman ini dilindungi dan hanya dapat diakses oleh peran tertentu (Admin / Staf). Silakan login dengan akun yang memiliki hak akses.',
    icon: Lock,
    badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    actionLabel: 'Login Member / Admin',
    actionHref: '/login',
  },
  419: {
    code: 419,
    title: 'Sesi Berakhir (Page Expired)',
    subtitle: 'Sesi keamanan formulir Anda telah kadaluarsa karena tidak ada aktivitas.',
    description:
      'Untuk alasan keamanan (CSRF Token), halaman ini perlu dimuat ulang sebelum Anda melanjutkan pengisian formulir.',
    icon: Clock,
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    actionLabel: 'Muat Ulang Halaman',
    isReload: true,
  },
  503: {
    code: 503,
    title: 'Pemeliharaan Sistem',
    subtitle: 'Portal sekolah sedang dalam perawatan dan pembaruan rutin.',
    description:
      'Kami sedang meningkatkan kualitas layanan digital sekolah. Silakan kembali dalam beberapa saat lagi.',
    icon: Wrench,
    badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    actionLabel: 'Coba Lagi',
    isReload: true,
  },
  500: {
    code: 500,
    title: 'Terjadi Kesalahan Server',
    subtitle: 'Sistem mengalami kendala teknis internal.',
    description:
      'Terjadi kesalahan yang tidak terduga pada server kami. Tim teknis telah menerima laporan dan sedang menanganinya.',
    icon: ServerCrash,
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    actionLabel: 'Kembali ke Beranda',
    actionHref: '/',
  },
}

export default function ErrorPage({ status = 404, message }: Props) {
  const siteName = useSiteName()
  const meta = errorConfigs[status] || {
    code: status,
    title: 'Terjadi Kesalahan',
    subtitle: message || 'Terjadi kesalahan yang tidak terduga.',
    description: 'Silakan kembali ke halaman utama atau hubungi administrator sekolah jika masalah berlanjut.',
    icon: AlertCircle,
    badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    actionLabel: 'Kembali ke Beranda',
    actionHref: '/',
  }

  const Icon = meta.icon

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-12 md:py-20">
      <Head title={`${meta.code} - ${meta.title} | ${siteName}`} />

      <div className="relative w-full max-w-xl text-center">
        {/* Soft background glow */}
        <div className="absolute -top-12 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-soft/40 blur-3xl dark:bg-sky-950/40" />

        {/* Status Badge & Giant Code */}
        <div className="mx-auto mb-6 flex w-fit flex-col items-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide ${meta.badgeColor}`}
          >
            <Icon className="h-4 w-4" />
            <span>GALAT {meta.code}</span>
          </span>
          <h1 className="mt-4 text-7xl font-extrabold tracking-tight text-ink dark:text-slate-100 sm:text-8xl md:text-9xl">
            {meta.code}
          </h1>
        </div>

        {/* Content Box */}
        <div className="rounded-[28px] border border-line bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:p-8 md:p-10">
          <BentoEyebrow className="!mb-1">INFORMASI PORTAL</BentoEyebrow>
          <h2 className="text-balance text-xl font-bold tracking-tight text-ink dark:text-slate-100 sm:text-2xl md:text-3xl">
            {meta.title}
          </h2>
          <p className="mt-2.5 text-sm font-medium leading-relaxed text-body dark:text-slate-300 sm:text-base">
            {meta.subtitle}
          </p>

          <p className="mt-4 text-xs leading-relaxed text-subtle dark:text-slate-400 sm:text-sm">
            {message || meta.description}
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {meta.isReload ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-sky-600 active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                {meta.actionLabel || 'Muat Ulang Halaman'}
              </button>
            ) : (
              <Link
                href={meta.actionHref || '/'}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-sky-600 active:scale-95"
              >
                <Home className="h-4 w-4" />
                {meta.actionLabel || 'Kembali ke Beranda'}
              </Link>
            )}

            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-body shadow-sm transition hover:bg-muted active:scale-95 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Halaman Sebelumnya
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-xs text-subtle dark:text-slate-500">
          {siteName} &mdash; Sistem Informasi Terintegrasi Sekolah
        </p>
      </div>
    </div>
  )
}
