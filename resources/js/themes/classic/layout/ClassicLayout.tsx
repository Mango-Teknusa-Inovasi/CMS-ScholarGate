import React, { type ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Newspaper, Bell, Calendar, Search, LogIn, ShieldCheck, ChevronDown, Menu, X, ArrowUpRight } from 'lucide-react';
import { HookSlot } from '@/components/ui/HookSlot';

import type { PageProps } from '@inertiajs/core';

interface SharedProps extends PageProps {
    app?: {
        name?: string;
        url?: string;
        logo_url?: string | null;
        tagline?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    auth?: { user?: { name?: string; role?: string; is_admin?: boolean } | null };
}

export function ClassicLayout({ children }: { children: ReactNode }) {
    const { props, url } = usePage<SharedProps>();
    const siteName = props.app?.name || 'Portal Resmi Sekolah';
    const logoUrl = props.app?.logo_url;
    const tagline = props.app?.tagline;
    const email = props.app?.email;
    const address = props.app?.address;
    const phone = props.app?.phone;
    const user = props.auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const isActive = (path: string) => {
        if (path === '/') return url === '/';
        return url.startsWith(path);
    };

    const navLinks = [
        { href: '/', label: 'Beranda' },
        { href: '/profil', label: 'Profil' },
        { href: '/artikel', label: 'Artikel & Berita' },
        { href: '/prestasi', label: 'Prestasi' },
        { href: '/ekstrakurikuler', label: 'Ekstrakurikuler' },
        { href: '/download', label: 'Download' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased">
            {/* Top Bar: Date, Notice Ticker & Quick User Actions */}
            <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider">
                            <Bell className="w-3 h-3" /> Warta Sekolah
                        </span>
                        <span className="hidden sm:inline text-slate-400 text-[11px] truncate max-w-md">
                            {tagline || `Portal Informasi Resmi Kebijakan & Prestasi Akademik`}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="hidden md:flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-red-500" />
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <div className="h-3 w-px bg-slate-700 hidden md:block" />
                        {user ? (
                            <Link href="/admin" className="flex items-center gap-1 text-slate-200 hover:text-white font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{user.name} ({user.is_admin ? 'Admin' : 'Member'})</span>
                            </Link>
                        ) : (
                            <Link href="/admin/login" className="flex items-center gap-1 hover:text-white transition">
                                <LogIn className="w-3.5 h-3.5 text-red-400" />
                                <span>Masuk Admin</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Header / Brand Newspaper Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 lg:px-8 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-3.5 group">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={siteName}
                                className="h-12 w-auto object-contain max-w-[180px] drop-shadow-sm"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-red-600 text-white flex items-center justify-center font-serif font-black text-2xl shadow-md group-hover:bg-red-700 transition">
                                <Newspaper className="w-7 h-7" />
                            </div>
                        )}
                        <div>
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest block">
                                {tagline || 'KORAN DIGITAL MAJALAH SEKOLAH'}
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-serif">
                                {siteName}
                            </h1>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <form action="/artikel" method="GET" className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                name="q"
                                placeholder="Cari berita & artikel..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        </form>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Bar (Red Accent Bar) */}
            <nav className="bg-slate-900 text-white border-b-2 border-red-600 sticky top-0 z-40 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="hidden md:flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                            {navLinks.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                                            active
                                                ? 'bg-red-600 text-white shadow-inner'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                            Edisi Informasi Digital
                        </div>
                    </div>

                    {/* Mobile Navigation Dropdown */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-3 border-t border-slate-800 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-3 py-2 text-xs font-bold uppercase tracking-wider rounded ${
                                        isActive(link.href) ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            {/* Hook Slot: After Navbar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
                <HookSlot name="after_navbar" />
            </div>

            {/* Main Content Body */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>

            {/* Hook Slot: Before Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 w-full">
                <HookSlot name="before_footer" />
            </div>

            {/* Classic Newspaper Footer */}
            <footer className="bg-slate-900 text-slate-300 border-t-4 border-red-600 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-white font-bold font-serif text-base">
                            {logoUrl ? (
                                <img src={logoUrl} alt={siteName} className="h-7 w-auto object-contain brightness-0 invert" />
                            ) : (
                                <Newspaper className="w-5 h-5 text-red-500" />
                            )}
                            <span>{siteName}</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                            Portal Resmi Publikasi Berita, Pengumuman, dan Dokumentasi Prestasi Akademik Sekolah.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white uppercase tracking-wider mb-3 border-l-2 border-red-600 pl-2">
                            Kategori Berita
                        </h4>
                        <ul className="space-y-2 text-slate-400">
                            <li><Link href="/artikel?cat=kegiatan" className="hover:text-white">Kegiatan Sekolah</Link></li>
                            <li><Link href="/artikel?cat=pengumuman" className="hover:text-white">Pengumuman Resmi</Link></li>
                            <li><Link href="/artikel?cat=prestasi" className="hover:text-white">Kilas Prestasi</Link></li>
                            <li><Link href="/artikel?cat=ekstrakurikuler" className="hover:text-white">Ekskul & Komunitas</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white uppercase tracking-wider mb-3 border-l-2 border-red-600 pl-2">
                            Layanan Publik
                        </h4>
                        <ul className="space-y-2 text-slate-400">
                            <li><Link href="/download" className="hover:text-white">Pusat Unduhan Dokumentasi</Link></li>
                            <li><Link href="/profil" className="hover:text-white">Visi, Misi & Sejarah</Link></li>
                            <li><Link href="/prestasi" className="hover:text-white">Direktori Prestasi Siswa</Link></li>
                            <li><Link href="/kebijakan-privasi" className="hover:text-white">Kebijakan Privasi</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white uppercase tracking-wider mb-3 border-l-2 border-red-600 pl-2">
                            Redaksi & Kontak
                        </h4>
                        {address ? (
                            <p className="text-slate-400 leading-relaxed mb-2">{address}</p>
                        ) : (
                            <p className="text-slate-400 leading-relaxed mb-2">Portal Informasi Resmi Sekolah</p>
                        )}
                        {email && <p className="text-slate-400 font-mono">Email: {email}</p>}
                        {phone && <p className="text-slate-400 font-mono">Telp: {phone}</p>}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
                    <p>© {new Date().getFullYear()} {siteName}. Hak Cipta Dilindungi Undang-Undang.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/syarat-ketentuan" className="hover:text-slate-300">Syarat & Ketentuan</Link>
                        <span>•</span>
                        <Link href="/kebijakan-privasi" className="hover:text-slate-300">Kebijakan Privasi</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default ClassicLayout;
