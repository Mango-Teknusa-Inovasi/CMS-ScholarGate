import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Award, Trophy, Star, Calendar, ChevronRight } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

interface Achievement {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    cover_url?: string | null;
    achievement_date?: string | null;
    level?: string;
}

interface AchievementsPageProps {
    achievements?: { data: Achievement[] } | Achievement[];
}

export function ClassicAchievementsPage({ achievements }: AchievementsPageProps) {
    const list: Achievement[] = Array.isArray(achievements)
        ? achievements
        : achievements?.data || [];

    return (
        <>
            <Head title="Kilas Prestasi Siswa & Sekolah — Portal Resmi" />

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <Trophy className="w-4 h-4" /> KILAS PRESTASI & PENGHARGAAN
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Direktori Prestasi Siswa & Lembaga
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Catatan kebanggaan atas raihan kejuaraan di tingkat Kabupaten, Provinsi, Nasional hingga Internasional.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.length > 0 ? (
                    list.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between group hover:border-red-500/50 transition"
                        >
                            <div>
                                {item.cover_url && (
                                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                    </div>
                                )}
                                <div className="p-5">
                                    <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                            {item.level || 'Kejuaraan'}
                                        </span>
                                        <span className="text-slate-400 text-[11px] font-mono">
                                            {item.achievement_date ? new Date(item.achievement_date).toLocaleDateString('id-ID') : ''}
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
        </>
    );
}

ClassicAchievementsPage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicAchievementsPage;
