import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, SparklesIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

// Trik pricing: tahunan dijangkar ke 12x bulanan (coret Rp 600rb), lalu
// dibingkai per-bulan (Rp 33.250) supaya terasa lebih murah dari paket bulanan.
const PLANS = {
    monthly: { price: 50000 },
    yearly: { price: 399000, anchor: 600000 }, // = Rp 33.250/bln, "4 bulan gratis"
};

const FEATURES = [
    'Kelas & siswa tanpa batas',
    'Absensi harian + rekap bulanan',
    'Input & rekap nilai',
    'Kuis online + bank soal (rumus, gambar, audio, video)',
    'Export laporan Excel',
    'Sinkronisasi hari libur nasional',
];

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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

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

                    {/* Kartu paket: bulanan sebagai jangkar, tahunan ditonjolkan */}
                    <div className="grid sm:grid-cols-2 gap-4 items-stretch">

                        {/* Bulanan */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="order-2 sm:order-1 bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-7 shadow-xl dark:shadow-none flex flex-col"
                        >
                            <h3 className="text-base font-bold text-gray-700 dark:text-slate-300">Bulanan</h3>
                            <div className="mt-2 flex items-end gap-1">
                                <span className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{rp(PLANS.monthly.price)}</span>
                                <span className="text-gray-500 dark:text-slate-400 font-semibold mb-0.5 text-sm">/bulan</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Fleksibel, berhenti kapan saja.</p>

                            <ul className="mt-5 space-y-2.5 text-sm text-gray-700 dark:text-slate-300 flex-1">
                                {FEATURES.map((f) => (
                                    <li key={f} className="flex items-start gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>

                            <button disabled
                                className="mt-6 w-full bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold py-3 rounded-2xl opacity-70 cursor-not-allowed text-sm">
                                Pilih Bulanan (segera hadir)
                            </button>
                        </motion.div>

                        {/* Tahunan — dibingkai per-bulan supaya terasa lebih murah */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="order-1 sm:order-2 relative bg-gradient-to-b from-indigo-600 to-violet-700 rounded-[2rem] p-7 shadow-2xl shadow-indigo-500/40 text-white flex flex-col sm:scale-[1.03]"
                        >
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow">
                                ⭐ Paling Hemat
                            </span>

                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold">Tahunan</h3>
                                <span className="bg-white/20 text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full">4 bulan GRATIS</span>
                            </div>

                            <div className="mt-2 flex items-end gap-1">
                                <span className="text-3xl font-black tracking-tight">{rp(Math.round(PLANS.yearly.price / 12))}</span>
                                <span className="opacity-80 font-semibold mb-0.5 text-sm">/bulan</span>
                            </div>
                            <p className="mt-1 text-xs opacity-90">
                                Ditagih <span className="line-through opacity-70">{rp(PLANS.yearly.anchor)}</span>{' '}
                                <span className="font-black">{rp(PLANS.yearly.price)}</span>/tahun
                                — hemat {rp(PLANS.yearly.anchor - PLANS.yearly.price)}.
                            </p>

                            <ul className="mt-5 space-y-2.5 text-sm flex-1">
                                {FEATURES.map((f) => (
                                    <li key={f} className="flex items-start gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-amber-300 shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>

                            {/* ponytail: tombol langganan masih placeholder — integrasi Midtrans/Xendit menyusul (Phase 4) */}
                            <button disabled
                                className="mt-6 w-full bg-white text-indigo-700 font-black py-3 rounded-2xl shadow-lg opacity-80 cursor-not-allowed text-sm">
                                Pilih Tahunan (segera hadir)
                            </button>
                        </motion.div>
                    </div>

                    <p className="text-center text-xs text-gray-400 dark:text-slate-500">
                        Pembayaran online sedang disiapkan. Sementara ini hubungi admin untuk aktivasi.
                    </p>

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
