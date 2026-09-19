import React from 'react';
import { Head } from '@inertiajs/react';
import { School, Award, Target, Compass, BookOpen } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

export function ClassicProfilePage() {
    return (
        <>
            <Head title="Profil & Sejarah Sekolah — Portal Informasi Resmi" />

            {/* Header Banner */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <School className="w-4 h-4" /> DOKUMENTASI PROFIL SEKOLAH
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Profil, Visi, Misi & Sejarah Institusi
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Mewujudkan insan akademis yang unggul, berkarakter, dan berdaya saing global.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Vision & Mission Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="border-l-4 border-red-600 pl-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
                                <Target className="w-5 h-5 text-red-600" /> Visi Sekolah
                            </h2>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-100 dark:border-slate-800 font-serif">
                            "Menjadi lembaga pendidikan terkemuka yang melahirkan generasi berprestasi tinggi, berakhlak mulia, serta menguasai ilmu pengetahuan dan teknologi."
                        </p>

                        <div className="border-l-4 border-slate-800 dark:border-slate-200 pl-3 pt-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif flex items-center gap-2">
                                <Compass className="w-5 h-5 text-slate-700 dark:text-slate-300" /> Misi Sekolah
                            </h2>
                        </div>
                        <ul className="space-y-2 text-slate-700 dark:text-slate-300 text-xs sm:text-sm list-disc pl-5 leading-relaxed">
                            <li>Menyelenggarakan proses pembelajaran yang inovatif, efektif, dan berbasis teknologi informasi.</li>
                            <li>Mengembangkan keunggulan akademik dan non-akademik peserta didik secara berkelanjutan.</li>
                            <li>Menanamkan nilai-nilai karakter bangsa, kedisiplinan, serta kepedulian lingkungan sosial.</li>
                            <li>Memperkuat kemitraan dengan perguruan tinggi, dunia industri, dan alumni untuk pengembangan wawasan siswa.</li>
                        </ul>
                    </div>

                    {/* School History */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-serif border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-red-600" /> Sejarah Singkat Pendirian
                        </h2>
                        <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                            Didirikan sebagai salah satu pusat unggulan pendidikan di wilayah Kabupaten Mojokerto, sekolah ini terus berkembang mencetak ribuan lulusan berkualitas yang tersebar di berbagai perguruan tinggi negeri terbaik dan dunia kerja.
                        </p>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 border-l-4 border-red-600 pl-2">
                            Identitas Sekolah
                        </h3>
                        <dl className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                            <div className="pt-2 flex justify-between">
                                <dt className="text-slate-500">Status</dt>
                                <dd className="font-semibold text-slate-800 dark:text-slate-200">Negeri</dd>
                            </div>
                            <div className="pt-2 flex justify-between">
                                <dt className="text-slate-500">Akreditasi</dt>
                                <dd className="font-semibold text-emerald-600 dark:text-emerald-400">A (Unggul)</dd>
                            </div>
                            <div className="pt-2 flex justify-between">
                                <dt className="text-slate-500">Kurikulum</dt>
                                <dd className="font-semibold text-slate-800 dark:text-slate-200">Kurikulum Merdeka</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </>
    );
}

ClassicProfilePage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicProfilePage;
