import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { api, type Article, type Category } from '@/lib/api';
import { coverSrc, formatDate } from '@/lib/utils';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { Calendar, Eye, Printer, ChevronLeft, User, AlertCircle } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

interface ArticleDetailPageProps {
    slug?: string;
    article?: Article;
    related_articles?: Article[];
}

type DetailResponse = {
    article: Article;
    related: Article[];
    sidebar: {
        categories: Category[];
        popular: Article[];
    };
};

export function ClassicArticleDetailPage({ slug: propSlug, article: initialArticle }: ArticleDetailPageProps) {
    // Extract slug from URL if not passed in props
    const pathSlug = window.location.pathname.split('/artikel/')[1] || '';
    const currentSlug = propSlug || pathSlug;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['article', currentSlug],
        queryFn: async () => (await api.get<DetailResponse>(`/articles/${currentSlug}`)).data,
        enabled: !initialArticle && !!currentSlug,
    });

    const article = initialArticle || data?.article;
    const relatedList = data?.related || [];

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Memuat isi berita...
            </div>
        );
    }

    if (isError || !article) {
        return (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-slate-900 dark:text-white text-sm font-bold">Artikel tidak ditemukan</p>
                <Link href="/artikel" className="inline-block mt-4 text-xs text-red-600 font-bold hover:underline">
                    ← Kembali ke Indeks Berita
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head title={`${article.title} — Portal Berita`} />

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-medium">
                <Link href="/" className="hover:text-red-600">Beranda</Link>
                <span>/</span>
                <Link href="/artikel" className="hover:text-red-600">Artikel</Link>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">{article.title}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Article Editorial Container */}
                <article className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    {article.category && (
                        <span className="inline-block bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wider mb-3">
                            {article.category.name}
                        </span>
                    )}

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight leading-snug mb-4">
                        {article.title}
                    </h1>

                    {/* Metadata Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mb-6">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                <User className="w-3.5 h-3.5 text-red-600" />
                                Redaksi Sekolah
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(article.published_at)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px]">
                                <Eye className="w-3.5 h-3.5" /> {article.views ?? 0} Pembaca
                            </span>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                                title="Cetak Artikel"
                            >
                                <Printer className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Featured Cover Image */}
                    {article.cover_path && (
                        <div className="mb-6 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                            <img
                                src={coverSrc(article.cover_path, article.slug || article.id, 1200, 600)}
                                alt={article.title}
                                className="w-full h-auto max-h-[450px] object-cover"
                            />
                        </div>
                    )}

                    {/* Article Content Typography */}
                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed space-y-4 font-sans">
                        <SafeHtml content={article.content || article.excerpt || ''} />
                    </div>

                    {/* Back Button */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <Link
                            href="/artikel"
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-red-600 transition"
                        >
                            <ChevronLeft className="w-4 h-4" /> Kembali ke Indeks Berita
                        </Link>
                    </div>
                </article>

                {/* Sidebar: Related Articles */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 border-l-4 border-red-600 pl-2">
                            Berita Terkait
                        </h3>
                        {relatedList.length > 0 ? (
                            <div className="space-y-4">
                                {relatedList.slice(0, 5).map((rel) => (
                                    <div key={rel.id} className="group">
                                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-red-600 transition line-clamp-2 leading-snug font-serif">
                                            <Link href={`/artikel/${rel.slug}`}>{rel.title}</Link>
                                        </h4>
                                        <span className="text-[10px] text-slate-400 mt-1 block">
                                            {formatDate(rel.published_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">Belum ada berita terkait lainnya.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

ClassicArticleDetailPage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicArticleDetailPage;
