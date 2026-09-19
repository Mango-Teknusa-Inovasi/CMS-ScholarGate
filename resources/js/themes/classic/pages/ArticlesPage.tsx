import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { api, type Article, type Category } from '@/lib/api';
import { coverSrc, formatDate } from '@/lib/utils';
import { useSiteName } from '@/hooks/useSiteName';
import { Newspaper, Calendar, Search, Tag, Eye, ChevronRight, Filter } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

type ArticlesResponse = {
    featured: Article | null;
    articles: {
        data: Article[];
        current_page: number;
        last_page: number;
        total: number;
    };
    sidebar: {
        summary: { total_articles: number; total_categories: number };
        categories: Category[];
        popular: Article[];
    };
};

export function ClassicArticlesPage() {
    const siteName = useSiteName();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sort, setSort] = useState('latest');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['articles', searchQuery, selectedCategory, sort, page],
        queryFn: async () =>
            (
                await api.get<ArticlesResponse>('/articles', {
                    params: { q: searchQuery || undefined, category: selectedCategory || undefined, sort, page },
                })
            ).data,
    });

    const articlesList = data?.articles?.data || [];
    const categoriesList = data?.sidebar?.categories || [];

    return (
        <>
            <Head title={`Indeks Berita & Artikel — ${siteName}`} />

            {/* Header Banner */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <Newspaper className="w-4 h-4" /> KORAN DIGITAL & ARSIP BERITA
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Indeks Publikasi & Berita Resmi
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Arsip berita kegiatan, pengumuman, dan rilis pers resmi {siteName}.
                </p>
            </div>

            {/* Articles List & Filter Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Articles Area */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Search & Sort Filter Bar */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                placeholder="Cari berita & artikel..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                        >
                            <option value="">Semua Kategori</option>
                            {categoriesList.map((cat) => (
                                <option key={cat.id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {isLoading ? (
                        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                            Memuat daftar artikel...
                        </div>
                    ) : articlesList.length > 0 ? (
                        <div className="space-y-4">
                            {articlesList.map((art) => (
                                <article
                                    key={art.id}
                                    className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-5 hover:border-red-500/50 transition group"
                                >
                                    {art.cover_path && (
                                        <div className="w-full sm:w-48 aspect-video sm:aspect-square bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex-shrink-0">
                                            <img
                                                src={coverSrc(art.cover_path, art.slug || art.id, 500, 500)}
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
                                                    {formatDate(art.published_at)}
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
                                                <Eye className="w-3.5 h-3.5" /> {art.views ?? 0} pembaca
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
                    {categoriesList.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 border-l-4 border-red-600 pl-2">
                                Kategori Warta
                            </h3>
                            <div className="space-y-1 text-xs">
                                {categoriesList.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                                        className={`flex items-center justify-between w-full p-2 rounded text-left transition ${
                                            selectedCategory === cat.slug
                                                ? 'bg-red-600 text-white font-bold'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5" />
                                            {cat.name}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                    </button>
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
