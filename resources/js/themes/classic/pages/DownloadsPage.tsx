import React from 'react';
import { Head } from '@inertiajs/react';
import { Download, FileText, ExternalLink, HardDrive } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

interface DownloadItem {
    id: number;
    title: string;
    file_url: string;
    category?: string;
    created_at?: string;
    file_size?: string;
}

interface DownloadsPageProps {
    downloads?: DownloadItem[];
}

export function ClassicDownloadsPage({ downloads = [] }: DownloadsPageProps) {
    return (
        <>
            <Head title="Pusat Unduhan & Dokumentasi — Portal Resmi" />

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <Download className="w-4 h-4" /> REPOSITORI DOKUMEN & FORMULIR
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Pusat Unduhan Dokumentasi Resmi
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Unduh berkas administrasi, formulir pendaftaran, kalender akademik, dan surat edaran resmi.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {downloads.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {downloads.map((item) => (
                            <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-lg flex-shrink-0 mt-0.5">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm font-serif">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                            <span>{item.category || 'Dokumen Resmi'}</span>
                                            {item.created_at && (
                                                <span>• {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={item.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded text-xs font-bold hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition w-full sm:w-auto justify-center"
                                >
                                    <Download className="w-3.5 h-3.5" /> Unduh Berkas
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 text-xs">
                        Belum ada berkas unduhan yang tersedia.
                    </div>
                )}
            </div>
        </>
    );
}

ClassicDownloadsPage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicDownloadsPage;
