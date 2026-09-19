import React from 'react';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/utils';
import { useSiteName } from '@/hooks/useSiteName';
import { Users, Activity, Calendar, UserRound, Sparkles } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

type Extracurricular = {
    id: number;
    title: string;
    description?: string;
    icon?: string | null;
    logo_path?: string | null;
    schedule?: string | null;
    coach?: string | null;
    url?: string | null;
};

export function ClassicExtracurricularPage() {
    const siteName = useSiteName();

    const { data = [], isLoading } = useQuery({
        queryKey: ['ekstrakurikuler'],
        queryFn: async () => (await api.get<Extracurricular[]>('/ekstrakurikuler')).data,
    });

    return (
        <>
            <Head title={`Ekstrakurikuler — ${siteName}`} />

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <Activity className="w-4 h-4" /> DIREKTORI EKSTRAKURIKULER
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Ekstrakurikuler & Organisasi Kesiswaan
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Wadah pengembangan minat, bakat, kepemimpinan, dan kreativitas siswa {siteName}.
                </p>
            </div>

            {isLoading ? (
                <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 text-xs text-slate-500">
                    Memuat daftar ekstrakurikuler...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.length > 0 ? (
                        data.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        {item.logo_path ? (
                                            <img
                                                src={mediaUrl(item.logo_path)}
                                                alt={item.title}
                                                className="w-10 h-10 object-contain rounded border border-slate-200 dark:border-slate-700 p-0.5"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-bold">
                                                <Users className="w-5 h-5" />
                                            </div>
                                        )}
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base font-serif">
                                            {item.title}
                                        </h3>
                                    </div>
                                    {item.description && (
                                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-3">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    {item.schedule && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-red-500" />
                                            <span>{item.schedule}</span>
                                        </div>
                                    )}
                                    {item.coach && (
                                        <div className="flex items-center gap-1.5">
                                            <UserRound className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Pembina: <strong className="text-slate-700 dark:text-slate-300">{item.coach}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                            Belum ada daftar ekstrakurikuler yang diinputkan.
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

ClassicExtracurricularPage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicExtracurricularPage;
