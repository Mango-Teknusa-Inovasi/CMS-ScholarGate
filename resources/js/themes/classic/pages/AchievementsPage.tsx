import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { api, type Achievement } from '@/lib/api';
import { coverSrc, formatDate } from '@/lib/utils';
import { useSiteName } from '@/hooks/useSiteName';
import { Trophy, Star, ChevronRight } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

export function ClassicAchievementsPage() {
    const siteName = useSiteName();

    const { data, isLoading } = useQuery({
        queryKey: ['achievements'],
        queryFn: async () => (await api.get<{ data: Achievement[] }>('/achievements')).data,
    });

    const items = data?.data || [];

    return (
        <>
            <Head title={`Kilas Prestasi — ${siteName}`} />

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <Trophy className="w-4 h-4" /> KILAS PRESTASI & PENGHARGAAN
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Direktori Prestasi & Keunggulan Siswa
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Catatan kebanggaan atas raihan kejuaraan peserta didik dan ekosistem {siteName}.
                </p>
            </div>

            {isLoading ? (
                <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 text-xs text-slate-500">
                    Memuat data prestasi...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between group hover:border-red-500/50 transition"
                            >
                                <div>
                                    {item.cover_path && (
                                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <img
                                                src={coverSrc(item.cover_path, item.slug || item.id, 600, 360)}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                                {item.badge_label || 'Kejuaraan'}
                                            </span>
                                            <span className="text-slate-400 text-[11px] font-mono">
                                                {formatDate(item.achieved_at)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base font-serif leading-snug group-hover:text-red-600 transition mb-2">
                                            <Link href={`/prestasi/${item.slug}`}>{item.title}</Link>
                                        </h3>
                                        {item.excerpt && (
                                            <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-2 leading-relaxed">
                                                {item.excerpt}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <Link
                                        href={`/prestasi/${item.slug}`}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline uppercase tracking-wider"
                                    >
                                        Rincian Prestasi <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                            Belum ada data prestasi yang dipublikasikan.
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

ClassicAchievementsPage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicAchievementsPage;
