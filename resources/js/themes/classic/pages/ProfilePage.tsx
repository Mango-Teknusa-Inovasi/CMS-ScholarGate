import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { api, type ContactInfo, type QuickService, type WelcomeBlock } from '@/lib/api';
import { useSiteName } from '@/hooks/useSiteName';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { coverSrc } from '@/lib/utils';
import { School, Target, BookOpen, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import ClassicLayout from '../layout/ClassicLayout';

type ProfilePayload = {
    page: {
        title: string;
        subtitle?: string;
        tabs: { key: string; label: string; content_html: string }[];
    } | null;
    welcome: WelcomeBlock | null;
    contacts: ContactInfo[];
    quick_services: QuickService[];
};

export function ClassicProfilePage() {
    const siteName = useSiteName();
    const [activeTab, setActiveTab] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => (await api.get<ProfilePayload>('/profile')).data,
    });

    const tabs = data?.page?.tabs || [];
    const currentTab = tabs[activeTab];

    return (
        <>
            <Head title={`Profil & Sejarah — ${siteName}`} />

            {/* Header Banner */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">
                    <School className="w-4 h-4" /> DOKUMENTASI PROFIL SEKOLAH
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-serif tracking-tight">
                    {data?.page?.title || `Profil ${siteName}`}
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                    {data?.page?.subtitle || `Profil resmi, dokumentasi sejarah, visi & misi ${siteName}`}
                </p>
            </div>

            {isLoading ? (
                <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-lg border border-slate-200 text-xs text-slate-500">
                    Memuat profil sekolah...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Welcome / Sambutan Pejabat */}
                        {data?.welcome && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
                                {(data.welcome.image_url || data.welcome.image_path) && (
                                    <div className="w-full sm:w-44 aspect-[4/5] rounded overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                        <img
                                            src={coverSrc(data.welcome.image_url || data.welcome.image_path, 'welcome', 400, 500)}
                                            alt={data.welcome.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 space-y-3">
                                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest block">
                                        {data.welcome.badge_left || 'SAMBUTAN PIMPINAN'}
                                    </span>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-serif">
                                        {data.welcome.title}
                                    </h2>
                                    <div className="prose prose-slate dark:prose-invert text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                        <SafeHtml content={data.welcome.body} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Tabs (Visi, Misi, Sejarah, dll.) */}
                        {tabs.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2">
                                    {tabs.map((t, idx) => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => setActiveTab(idx)}
                                            className={`px-4 py-2 rounded text-xs font-bold transition ${
                                                idx === activeTab
                                                    ? 'bg-red-600 text-white shadow-sm'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-6">
                                    <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                                        <SafeHtml content={currentTab?.content_html || ''} />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Sidebar Info & Contacts */}
                    <div className="lg:col-span-4 space-y-6">
                        {data?.contacts && data.contacts.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 border-l-4 border-red-600 pl-2">
                                    Informasi Kontak Resmi
                                </h3>
                                <div className="space-y-3 text-xs">
                                    {data.contacts.map((c) => (
                                        <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                {c.label}
                                            </span>
                                            <p className="font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line">
                                                {c.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

ClassicProfilePage.layout = (page: React.ReactNode) => <ClassicLayout>{page}</ClassicLayout>;

export default ClassicProfilePage;
