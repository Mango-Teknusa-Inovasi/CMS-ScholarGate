import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { api, type HomePayload, type Article } from '@/lib/api';
import { coverSrc, formatDate } from '@/lib/utils';
import { useSiteName } from '@/hooks/useSiteName';
import { HookSlot } from '@/components/ui/HookSlot';
import { Newspaper, Bell, Calendar, ChevronRight, ArrowRight, Eye, Tag, AlertCircle } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

export function ClassicNewsHomePage() {
    const siteName = useSiteName();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['home'],
        queryFn: async () => (await api.get<HomePayload>('/home')).data,
    });

    const articles = data?.articles || [];
    const headline = articles[0];
    const subArticles = articles.slice(1, 5);
    const recentArticles = articles.slice(5);
    const announcements = articles.filter(a => a.category?.slug === 'pengumuman' || a.category?.name?.toLowerCase().includes('pengumuman'));
    const displayAnnouncements = announcements.length > 0 ? announcements : articles.slice(0, 4);

    return (
        <>
            <Head title={`Portal Berita Utama — ${siteName}`} />

            {/* Plain White Traditional News Header Container */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden mb-6">
                {/* News Breaking Ticker / Notice Bar */}
                <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 py-2.5 px-4 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-600 text-white font-bold text-[11px] uppercase tracking-wider">
                                <Bell className="w-3 h-3" /> Berita Terkini
                            </span>
                            <span className="truncate max-w-md sm:max-w-xl">
                                {headline ? headline.title : 'Selamat datang di portal informasi resmi'}
                            </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Main News Title Bar */}
                <div className="px-6 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                                <Newspaper className="w-4 h-4" /> TEMA KLASIK NEWS PORTAL
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-serif">
                                {siteName}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/artikel"
                                className="px-4 py-2 rounded border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                                Indeks Berita
                            </Link>
                            <Link
                                href="/download"
                                className="px-4 py-2 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition"
                            >
                                Dokumen & Download
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hook Slot: After Header */}
            <div className="mt-4 mb-6">
                <HookSlot name="after_navbar" />
            </div>

            {/* Loading & Error States */}
            {isLoading && (
                <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mb-3"></div>
                    <p className="text-xs text-slate-500">Memuat warta & berita terbaru...</p>
                </div>
            )}

            {isError && (
                <div className="bg-white dark:bg-slate-900 p-8 text-center rounded-lg border border-red-200 dark:border-red-950">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Gagal memuat berita</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 text-xs bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Main Newspaper Grid Container */}
            {!isLoading && !isError && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Main News Left Column (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Lead Headline Story */}
                        {headline ? (
                            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                {headline.cover_path && (
                                    <div className="aspect-[21/9] bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                                        <img
                                            src={coverSrc(headline.cover_path, headline.slug || headline.id, 1200, 600)}
                                            alt={headline.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {headline.category && (
                                            <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow">
                                                {headline.category.name}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(headline.published_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" /> {headline.views ?? 0} Pembaca
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition leading-snug mb-3 font-serif">
                                        <Link href={`/artikel/${headline.slug}`}>{headline.title}</Link>
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3 mb-4">
                                        {headline.excerpt}
                                    </p>
                                    <Link
                                        href={`/artikel/${headline.slug}`}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline uppercase tracking-wider"
                                    >
                                        Baca Berita Selengkapnya <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 p-8 text-center rounded-lg border border-slate-200 text-xs text-slate-500">
                                Belum ada berita utama yang diterbitkan.
                            </div>
                        )}

                        {/* Sub Headline Grid (2x2) */}
                        {subArticles.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-l-4 border-red-600 pl-3">
                                    Berita Utama Lainnya
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {subArticles.map((art) => (
                                        <div key={art.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                                            <div>
                                                {art.cover_path && (
                                                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded mb-3 overflow-hidden">
                                                        <img
                                                            src={coverSrc(art.cover_path, art.slug || art.id, 600, 340)}
                                                            alt={art.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                {art.category && (
                                                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">
                                                        {art.category.name}
                                                    </span>
                                                )}
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 hover:text-red-600 transition mb-2 font-serif">
                                                    <Link href={`/artikel/${art.slug}`}>{art.title}</Link>
                                                </h4>
                                            </div>
                                            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <span>{formatDate(art.published_at)}</span>
                                                <Link href={`/artikel/${art.slug}`} className="text-red-600 font-semibold hover:underline">Baca</Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hook Slot: Home Bento / Replacement */}
                        <HookSlot name="home_bento" />

                        {/* Recent Articles List */}
                        {recentArticles.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-l-4 border-slate-800 dark:border-slate-200 pl-3">
                                    Arsip Berita Terbaru
                                </h3>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {recentArticles.map((art) => (
                                        <div key={art.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm hover:text-red-600 transition font-serif">
                                                    <Link href={`/artikel/${art.slug}`}>{art.title}</Link>
                                                </h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                    <span>{formatDate(art.published_at)}</span>
                                                    {art.category && (
                                                        <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                                                            <Tag className="w-3 h-3" /> {art.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Link href={`/artikel/${art.slug}`} className="text-slate-400 hover:text-red-600 flex-shrink-0 pt-1">
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Official Announcements Widget */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-red-600" /> Pengumuman Resmi
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {displayAnnouncements.length > 0 ? (
                                    displayAnnouncements.slice(0, 4).map((ann) => (
                                        <div key={ann.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-800">
                                            <Link href={`/artikel/${ann.slug}`} className="font-semibold text-xs text-slate-900 dark:text-white hover:text-red-600 line-clamp-2 block mb-1">
                                                {ann.title}
                                            </Link>
                                            <span className="text-[10px] text-slate-400">{formatDate(ann.published_at)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Belum ada pengumuman khusus.</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Navigation Links */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                                Menu Layanan Cepat
                            </h3>
                            <ul className="space-y-2 text-xs font-medium">
                                <li>
                                    <Link href="/profil" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
                                        <span>Profil & Sejarah Sekolah</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/prestasi" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
                                        <span>Prestasi & Keunggulan Siswa</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/ekstrakurikuler" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
                                        <span>Daftar Ekstrakurikuler</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/download" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
                                        <span>Pusat Unduhan & Formulir</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                </li>
                            </ul>
                        </div>

                    </div>

                </div>
            )}
        </>
    );
}

ClassicNewsHomePage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicNewsHomePage;
