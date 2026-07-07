import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    HomeIcon, UserIcon, CheckCircleIcon,
    ClipboardDocumentListIcon, ChartBarIcon, AcademicCapIcon,
    CalendarDaysIcon, ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    UserIcon as UserIconSolid,
    ClipboardDocumentListIcon as ClipboardSolid,
    ChartBarIcon as ChartBarSolid,
    CalendarDaysIcon as CalendarDaysIconSolid,
    ArchiveBoxIcon as ArchiveBoxIconSolid,
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const flash = usePage().props.flash;
    const [showToast, setShowToast] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Greeting berdasarkan jam
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const todayLabel = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    useEffect(() => {
        if (flash && flash.success) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const navItems = [
        { href: route('dashboard'), label: 'Dashboard', match: 'dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
        { href: route('bank-questions.index'), label: 'Bank Soal', match: 'bank-questions.index', icon: ArchiveBoxIcon, iconSolid: ArchiveBoxIconSolid },
        { href: route('holidays.index'), label: 'Hari Libur', match: 'holidays.index', icon: CalendarDaysIcon, iconSolid: CalendarDaysIconSolid },
    ];

    const mobileNavItems = [
        { href: route('dashboard'), label: 'Home', match: 'dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
        { href: route('bank-questions.index'), label: 'Soal', match: 'bank-questions.index', icon: ArchiveBoxIcon, iconSolid: ArchiveBoxIconSolid },
        { href: route('holidays.index'), label: 'Libur', match: 'holidays.index', icon: CalendarDaysIcon, iconSolid: CalendarDaysIconSolid },
        { href: route('profile.edit'), label: 'Profil', match: 'profile.edit', icon: UserIcon, iconSolid: UserIconSolid },
    ];

    // Banner peringatan: tampil saat akses (trial/langganan) tersisa <= 7 hari
    const accessNotice = (() => {
        if (!user || user.role !== 'teacher') return null;
        const now = new Date();
        const sub = user.subscription_ends_at ? new Date(user.subscription_ends_at) : null;
        const trial = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
        const subActive = sub && sub > now;
        const trialActive = trial && trial > now;
        if (!subActive && !trialActive) return null; // sudah terkunci (diarahkan ke /billing)
        const end = subActive ? sub : trial;
        const days = Math.ceil((end - now) / 86400000);
        if (days > 7) return null;
        return { days, isTrial: !subActive, urgent: days <= 3 };
    })();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden pb-20 sm:pb-0">
            {/* Abstract Background Elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-400 dark:bg-purple-600/25 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[120px] opacity-40 dark:opacity-100 pointer-events-none transition-all duration-300" />
            <div className="fixed top-[20%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-400 dark:bg-emerald-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[120px] opacity-30 dark:opacity-100 pointer-events-none transition-all duration-300" />
            <div className="fixed bottom-[-20%] left-[20%] w-[40rem] h-[40rem] bg-indigo-400 dark:bg-indigo-650/25 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[120px] opacity-40 dark:opacity-100 pointer-events-none transition-all duration-300" />

            <div className="relative z-50">
                {/* Floating Glassmorphism Navbar (Desktop) */}
                <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 hidden sm:block relative z-[100]">
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white dark:border-slate-850 shadow-lg dark:shadow-none flex h-20 items-center justify-between px-6 rounded-[2rem] transition-colors duration-300">
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <Link href="/">
                                <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30 dark:shadow-none transform hover:scale-105 transition-transform duration-300">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                    </svg>
                                </div>
                            </Link>

                            {/* Nav Links */}
                            <div className="hidden space-x-1 sm:flex items-center">
                                {navItems.map(({ href, label, match }) => (
                                    <NavLink
                                        key={label}
                                        href={href}
                                        active={route().current(match)}
                                        className="px-4 py-2 rounded-xl transition-all font-bold text-sm border-none bg-transparent"
                                    >
                                        {label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        {/* Right: greeting + theme switcher + user dropdown */}
                        <div className="hidden sm:flex sm:items-center gap-4">
                            {/* Date + greeting pill */}
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-xs font-bold text-gray-400 dark:text-slate-400">{getGreeting()}, {user.name.split(' ')[0]}!</span>
                                <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{todayLabel}</span>
                            </div>

                            {/* Theme switcher */}
                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white dark:border-slate-700 flex items-center justify-center text-gray-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md dark:hover:shadow-none focus:outline-none transition-all duration-200"
                                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-xl">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-xl bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 text-sm font-bold text-gray-800 dark:text-slate-200 transition duration-150 ease-in-out hover:bg-white/80 dark:hover:bg-slate-800/85 hover:shadow-md dark:hover:shadow-none focus:outline-none"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                {user.name}
                                                <svg className="-me-0.5 h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none mt-2">
                                        <Dropdown.Link href={route('profile.edit')} className="font-bold text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-850">
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button" className="font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Mobile Top Bar */}
                <div className="sm:hidden flex justify-between items-center px-6 py-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-white/50 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-500 dark:text-slate-400">{getGreeting()} 👋</div>
                            <div className="text-sm font-black text-gray-800 dark:text-slate-100">{user.name.split(' ')[0]}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white dark:border-slate-700/50 flex items-center justify-center text-gray-800 dark:text-slate-200 focus:outline-none transition-all duration-200"
                            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {theme === 'dark' ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                        <div className="text-xs text-gray-400 dark:text-slate-500 font-medium text-right">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                </div>

                {accessNotice && (
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
                        <Link
                            href={route('billing')}
                            className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 border shadow-sm transition-all hover:shadow-md ${
                                accessNotice.urgent
                                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
                                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300'
                            }`}
                        >
                            <span className="text-sm font-bold">
                                {accessNotice.isTrial ? 'Masa coba' : 'Langganan'} berakhir dalam {accessNotice.days} hari. Perpanjang agar akses tidak terputus.
                            </span>
                            <span className="shrink-0 text-sm font-extrabold whitespace-nowrap">Langganan →</span>
                        </Link>
                    </div>
                )}

                {header && (
                    <header className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-2 sm:mt-4">
                        {header}
                    </header>
                )}

                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.main>

                {/* Footer */}
                <footer className="hidden sm:block text-center py-6 mt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide transition-colors duration-300">
                        Made with <span className="text-rose-400">❤️</span> by <span className="text-indigo-600 dark:text-indigo-400 font-bold">Faishal</span>
                    </p>
                </footer>
            </div>

            {/* Floating Bottom Navigation (Mobile Only) */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-white dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none sm:hidden pb-safe transition-colors duration-300">
                <div className="flex justify-around items-center h-20 px-2 pb-2">
                    {mobileNavItems.map(({ href, label, match, icon: Icon, iconSolid: IconSolid }) => {
                        const isActive = route().current(match);
                        return (
                            <Link
                                key={label}
                                href={href}
                                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-300'}`}
                            >
                                <div className="relative">
                                    {isActive ? <IconSolid className="w-7 h-7 mb-1" /> : <Icon className="w-7 h-7 mb-1" />}
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-indicator"
                                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                                        />
                                    )}
                                </div>
                                <span className="text-[11px] font-bold">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Global Success Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-20 right-4 sm:top-8 sm:right-8 z-[100] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
                    >
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                        {flash.success}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
