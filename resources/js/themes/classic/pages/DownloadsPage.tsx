import React from 'react';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mediaUrl, formatDate } from '@/lib/utils';
import { useSiteName } from '@/hooks/useSiteName';
import { Download as DownloadIcon, FileText } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

type DownloadItem = {
    id: string | number;
    title: string;
    description?: string;
    file_name?: string;
    file_path?: string;
    file_url?: string;
    category?: string;
    download_count: number;
    published_at?: string;
};

export function ClassicDownloadsPage() {
    const siteName = useSiteName();

    const { data = [], isLoading } = useQuery({
        queryKey: ['downloads'],
        queryFn: async () => (await api.get<DownloadItem[]>('/downloads')).data,
    });

    return (
        <>
            <Head title={`Pusat Unduhan — ${siteName}`} />

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <DownloadIcon className="w-4 h-4" /> REPOSITORI DOKUMEN & FORMULIR
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    Pusat Unduhan Dokumentasi Resmi
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    Unduh berkas administrasi, formulir pendaftaran, kalender akademik, dan surat edaran resmi {siteName}.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500 text-xs">
                        Memuat daftar berkas unduhan...
                    </div>
                ) : data.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.map((item) => {
                            const fileDownloadUrl = mediaUrl(item.file_url || item.file_path);
                            return (
                                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-lg flex-shrink-0 mt-0.5">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-sm font-serif">
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                <span>{item.category || 'Dokumen Resmi'}</span>
                                                {item.published_at && (
                                                    <span>• {formatDate(item.published_at)}</span>
                                                )}
                                                <span>• {item.download_count ?? 0} unduhan</span>
                                            </div>
                                        </div>
                                    </div>
                                    {fileDownloadUrl ? (
                                        <a
                                            href={fileDownloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={item.file_name || undefined}
                                            onClick={() => {
                                                api.post(`/downloads/${item.id}/hit`).catch(() => {});
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded text-xs font-bold hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition w-full sm:w-auto justify-center"
                                        >
                                            <DownloadIcon className="w-3.5 h-3.5" /> Unduh Berkas
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Belum ada berkas</span>
                                    )}
                                </div>
                            );
                        })}
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
