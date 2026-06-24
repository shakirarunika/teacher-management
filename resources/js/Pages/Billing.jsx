import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, SparklesIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const PRICE = 'Rp 25.000';

function daysLeft(dateStr) {
    if (!dateStr) return 0;
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function Billing({ status }) {
    const trialDays = daysLeft(status.trial_ends_at);
    const locked = !status.active;

    return (
        <AuthenticatedLayout>
            <Head title="Langganan" />

            <div className="py-8 relative z-10">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Status banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-[2rem] p-6 text-white shadow-xl border border-white/20 ${
                            locked
                                ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {locked ? <LockClosedIcon className="w-7 h-7" /> : <SparklesIcon className="w-7 h-7" />}
                            <h2 className="text-xl font-extrabold">
                                {locked
                                    ? 'Masa akses Anda telah berakhir'
                                    : status.on_trial
                                        ? `Masa coba aktif — ${trialDays} hari lagi`
                                        : 'Langganan aktif'}
                            </h2>
                        </div>
                        <p className="mt-2 text-sm opacity-90">
                            {locked
                                ? 'Data Anda aman tersimpan. Berlangganan untuk mengaktifkan kembali dashboard, absensi, dan nilai.'
                                : 'Terima kasih telah menggunakan aplikasi. Anda bisa berlangganan kapan saja agar akses tidak terputus.'}
                        </p>
                    </motion.div>

                    {/* Plan card */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-8 shadow-xl dark:shadow-none"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Paket Guru</h3>
                        <div className="mt-2 flex items-end gap-1">
                            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{PRICE}</span>
                            <span className="text-gray-500 dark:text-slate-400 font-semibold mb-1">/bulan</span>
                        </div>

                        <ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-slate-300">
                            {['Kelas & siswa tanpa batas', 'Absensi harian + rekap bulanan', 'Input & rekap nilai', 'Sinkronisasi hari libur nasional'].map((f) => (
                                <li key={f} className="flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>

                        {/* ponytail: tombol langganan masih placeholder — integrasi Midtrans/Xendit menyusul (Phase 4) */}
                        <button
                            disabled
                            className="mt-8 w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-indigo-500/30 opacity-60 cursor-not-allowed"
                        >
                            Berlangganan (segera hadir)
                        </button>
                        <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">
                            Pembayaran online sedang disiapkan. Sementara ini hubungi admin untuk aktivasi.
                        </p>
                    </motion.div>

                    {!locked && (
                        <div className="text-center">
                            <Link href={route('dashboard')} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                ← Kembali ke Dashboard
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
