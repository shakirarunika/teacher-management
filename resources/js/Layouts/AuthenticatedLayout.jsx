import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    HomeIcon, UserIcon, CheckCircleIcon,
    ClipboardDocumentListIcon, ChartBarIcon, AcademicCapIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    UserIcon as UserIconSolid,
    ClipboardDocumentListIcon as ClipboardSolid,
    ChartBarIcon as ChartBarSolid,
    CalendarDaysIcon as CalendarDaysIconSolid,
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const flash = usePage().props.flash;
    const [showToast, setShowToast] = useState(false);

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
        { href: route('holidays.index'), label: 'Hari Libur', match: 'holidays.index', icon: CalendarDaysIcon, iconSolid: CalendarDaysIconSolid },
    ];

    const mobileNavItems = [
        { href: route('dashboard'), label: 'Home', match: 'dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
        { href: route('holidays.index'), label: 'Libur', match: 'holidays.index', icon: CalendarDaysIcon, iconSolid: CalendarDaysIconSolid },
        { href: route('profile.edit'), label: 'Profil', match: 'profile.edit', icon: UserIcon, iconSolid: UserIconSolid },
    ];

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden pb-20 sm:pb-0">
            {/* Abstract Background Elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 pointer-events-none" />
            <div className="fixed top-[20%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none" />
            <div className="fixed bottom-[-20%] left-[20%] w-[40rem] h-[40rem] bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 pointer-events-none" />

            <div className="relative z-50">
                {/* Floating Glassmorphism Navbar (Desktop) */}
                <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 hidden sm:block relative z-[100]">
                    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-lg flex h-20 items-center justify-between px-6 rounded-[2rem]">
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <Link href="/">
                                <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform duration-300">
                                    T
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

                        {/* Right: greeting + user dropdown */}
                        <div className="hidden sm:flex sm:items-center gap-4">
                            {/* Date + greeting pill */}
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-xs font-bold text-gray-400">{getGreeting()}, {user.name.split(' ')[0]}!</span>
                                <span className="text-xs text-gray-400 font-medium">{todayLabel}</span>
                            </div>

                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-xl">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-xl bg-white/50 px-4 py-2.5 text-sm font-bold text-gray-800 transition duration-150 ease-in-out hover:bg-white/80 hover:shadow-md focus:outline-none"
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

                                    <Dropdown.Content contentClasses="py-1 bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl shadow-indigo-100 mt-2">
                                        <Dropdown.Link href={route('profile.edit')} className="font-bold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button" className="font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Mobile Top Bar */}
                <div className="sm:hidden flex justify-between items-center px-6 py-4 bg-white/40 backdrop-blur-md border-b border-white/50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                            T
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-500">{getGreeting()} 👋</div>
                            <div className="text-sm font-black text-gray-800">{user.name.split(' ')[0]}</div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 font-medium text-right">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                </div>

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
            </div>

            {/* Floating Bottom Navigation (Mobile Only) */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:hidden pb-safe">
                <div className="flex justify-around items-center h-20 px-2 pb-2">
                    {mobileNavItems.map(({ href, label, match, icon: Icon, iconSolid: IconSolid }) => {
                        const isActive = route().current(match);
                        return (
                            <Link
                                key={label}
                                href={href}
                                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
                            >
                                <div className="relative">
                                    {isActive ? <IconSolid className="w-7 h-7 mb-1" /> : <Icon className="w-7 h-7 mb-1" />}
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-indicator"
                                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"
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
