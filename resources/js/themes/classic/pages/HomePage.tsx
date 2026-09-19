import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/components/layout/PublicLayout';
import { HookSlot } from '@/components/ui/HookSlot';
import { Sparkles, Calendar, ArrowRight, BookOpen, Award, Users } from 'lucide-react';

interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    cover_url: string | null;
    published_at: string | null;
    category?: { name: string; slug: string };
}

interface HomePageProps {
    articles?: Article[];
    latest_articles?: Article[];
    announcements?: Article[];
}

export default function ClassicHomePage({ articles = [], latest_articles = [], announcements = [] }: HomePageProps) {
    const { props } = usePage<{ app?: { name?: string } }>();
    const siteName = props.app?.name || 'Portal Resmi Sekolah';
    const displayArticles = articles.length > 0 ? articles : latest_articles;

    return (
        <PublicLayout>
            <Head title={`Beranda Klasik — ${siteName}`} />

            {/* Classic Academic Hero Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-6">
                        <Sparkles className="w-3.5 h-3.5" /> Tema Klasik Akademis Active
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                        Selamat Datang di {siteName}
                    </h1>
                    <p className="text-lg text-emerald-100/90 max-w-2xl mx-auto mb-8 leading-relaxed">
                        Pusat informasi, keunggulan akademis, pengumuman resmi, dan prestasi terbaru civitas akademika.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/articles"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition shadow-lg shadow-emerald-900/40"
                        >
                            <BookOpen className="w-4 h-4" /> Jelajahi Artikel & Berita
                        </Link>
                        <Link
                            href="/profile"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition backdrop-blur-sm border border-white/10"
                        >
                            Profil Sekolah
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hook Slot: After Hero */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
                <HookSlot name="after_navbar" />
            </div>

            {/* Quick Stats Counter */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{displayArticles.length}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Artikel & Publikasi</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">Prestasi</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Keunggulan Akademis</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">Ekstrakurikuler</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Pengembangan Bakat</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hook Slot: Home Bento / Main Content Replacement */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <HookSlot name="home_bento" />
            </div>

            {/* Classic Two-Column News Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
                <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Warta & Berita Terbaru
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Kabar terkini dan informasi resmi kegiatan sekolah.
                        </p>
                    </div>
                    <Link
                        href="/articles"
                        className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                        Lihat Semua <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayArticles.slice(0, 6).map((article) => (
                        <article
                            key={article.id}
                            className="bg-white dark:bg-slate-800/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-slate-200/80 dark:border-slate-700/80 flex flex-col"
                        >
                            {article.cover_url && (
                                <div className="aspect-video bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                    <img
                                        src={article.cover_url}
                                        alt={article.title}
                                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                                    />
                                </div>
                            )}
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    {article.category && (
                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 block">
                                            {article.category.name}
                                        </span>
                                    )}
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                                        <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-4 leading-relaxed">
                                        {article.excerpt}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID') : 'Terbaru'}
                                    </span>
                                    <Link
                                        href={`/articles/${article.slug}`}
                                        className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                                    >
                                        Baca Selengkapnya
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {/* Hook Slot: Before Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <HookSlot name="before_footer" />
            </div>
        </PublicLayout>
    );
}
