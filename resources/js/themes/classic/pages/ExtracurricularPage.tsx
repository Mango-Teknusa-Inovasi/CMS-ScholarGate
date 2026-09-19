import React from 'react';
import { Head } from '@inertiajs/react';
import { Users, Activity, CheckCircle2 } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

interface Extracurricular {
    id: number;
    name: string;
    description?: string;
    category?: string;
    coach?: string;
}

interface ExtracurricularPageProps {
    extracurriculars?: Extracurricular[];
}

export function ClassicExtracurricularPage({ extracurriculars = [] }: ExtracurricularPageProps) {
    return (
        <>
            <Head title="Ekstrakurikuler & Organisasi Siswa — Portal Resmi" />

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <Activity className="w-4 h-4" /> DIREKTORI EKSTRAKURIKULER
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Ekstrakurikuler & Organisasi Kesiswaan
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Wadah pengembangan bakat, minat, kepemimpinan, dan kreativitas minat siswa.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {extracurriculars.length > 0 ? (
                    extracurriculars.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                                <Users className="w-4 h-4" />
                                <span>{item.name}</span>
                            </div>
                            {item.description && (
                                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                    {item.description}
                                </p>
                            )}
                            {item.coach && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                                    Pembina: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.coach}</span>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                        Belum ada daftar ekstrakurikuler yang diinputkan.
                    </div>
                )}
            </div>
        </>
    );
}

ClassicExtracurricularPage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicExtracurricularPage;
