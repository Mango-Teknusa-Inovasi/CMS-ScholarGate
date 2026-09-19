import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Newspaper, Calendar, Search, Tag, Eye, ChevronRight } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    cover_url: string | null;
    published_at: string | null;
    views_count?: number;
    category?: { name: string; slug: string };
}

interface ArticlesPageProps {
    articles?: {
        data: Article[];
        links?: Array<{ url: string | null; label: string; active: boolean }>;
        current_page?: number;
        last_page?: number;
    } | Article[];
    categories?: Array<{ id: number; name: string; slug: string }>;
}

export function ClassicArticlesPage({ articles, categories = [] }: ArticlesPageProps) {
    const articleList: Article[] = Array.isArray(articles)
        ? articles
        : articles?.data || [];

    return (
        <>
            <Head title="Indeks Berita & Artikel — Portal Informasi Resmi" />

            {/* Header Banner */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <Newspaper className="w-4 h-4" /> KORAN DIGITAL & ARSIP BERITA
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Indeks Publikasi & Berita Resmi
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Arsip lengkap pengumuman, berita kegiatan, dan rilis pers civitas akademika sekolah.
                </p>
            </div>

            {/* Articles List & Filter Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Articles Area */}
                <div className="lg:col-span-8 space-y-4">
                    {articleList.length > 0 ? (
                        <div className="space-y-4">
                            {articleList.map((art) => (
                                <article
                                    key={art.id}
                                    className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-5 hover:border-red-500/50 transition group"
                                >
                                    {art.cover_url && (
                                        <div className="w-full sm:w-48 aspect-video sm:aspect-square bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex-shrink-0">
                                            <img
                                                src={art.cover_url}
                                                alt={art.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                                                {art.category && (
                                                    <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                                        {art.category.name}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 font-mono">
                                                    <Calendar className="w-3 h-3" />
                                                    {art.published_at ? new Date(art.published_at).toLocaleDateString('id-ID') : 'Baru'}
                                                </span>
                                            </div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition leading-snug mb-2 font-serif">
                                                <Link href={`/artikel/${art.slug}`}>{art.title}</Link>
                                            </h2>
                                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-2">
                                                {art.excerpt}
                                            </p>
                                        </div>
                                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5" /> {art.views_count ?? 0} pembaca
                                            </span>
                                            <Link
                                                href={`/artikel/${art.slug}`}
                                                className="inline-flex items-center gap-1 font-bold text-red-600 hover:underline uppercase text-[11px] tracking-wider"
                                            >
                                                Baca Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                            Belum ada artikel atau berita yang diterbitkan.
                        </div>
                    )}
                </div>

                {/* Sidebar Filter & Categories */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 border-l-4 border-red-600 pl-2">
                            Pencarian Berita
                        </h3>
                        <form action="/artikel" method="GET" className="relative">
                            <input
                                type="text"
                                name="q"
                                placeholder="Kata kunci..."
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </form>
                    </div>

                    {categories.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 border-l-4 border-red-600 pl-2">
                                Kategori Warta
                            </h3>
                            <div className="space-y-1 text-xs">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/artikel?cat=${cat.slug}`}
                                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-red-500" />
                                            {cat.name}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ClassicArticlesPage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicArticlesPage;
