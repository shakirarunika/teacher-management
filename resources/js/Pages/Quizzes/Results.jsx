import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import MathText from '@/Components/MathText';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    ArrowLeftIcon, CheckCircleIcon, ClipboardDocumentCheckIcon,
    ExclamationCircleIcon, TrophyIcon,
} from '@heroicons/react/24/outline';

const scoreColor = (score) =>
    score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 60 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';

const fmtDuration = (s) => {
    if (s == null) return '-';
    if (s < 60) return `${s} dtk`;
    return `${Math.floor(s / 60)}m ${s % 60}d`;
};

export default function QuizResults({ quiz, classroom, subject, attempts, questionStats, kkm, studentsNotDone }) {
    const { flash } = usePage().props;
    const [showCopy, setShowCopy] = useState(false);
    const copyForm = useForm({ column: 'tugas' });

    const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
    const totalStudents = attempts.length + studentsNotDone.length;
    const lowest = attempts.length ? Math.min(...attempts.map((a) => a.score)) : null;
    const durations = attempts.filter((a) => a.duration_seconds != null).map((a) => a.duration_seconds);
    const avgDuration = durations.length ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : null;
    const remedialCount = attempts.filter((a) => a.score < kkm).length;

    // Distribusi nilai: 5 kelompok
    const buckets = [
        { label: '0-59', min: 0, max: 59 },
        { label: '60-69', min: 60, max: 69 },
        { label: '70-79', min: 70, max: 79 },
        { label: '80-89', min: 80, max: 89 },
        { label: '90-100', min: 90, max: 100 },
    ].map((b) => ({ ...b, count: attempts.filter((a) => a.score >= b.min && a.score <= b.max).length }));
    const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

    const submitCopy = (e) => {
        e.preventDefault();
        copyForm.post(route('quizzes.copy-scores', quiz.id), {
            preserveScroll: true,
            onSuccess: () => setShowCopy(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Hasil - ${quiz.title}`} />

            <div className="py-2 sm:py-8 relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <Link href={route('quizzes.index', classroom.id)} className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/45 border border-white dark:border-slate-800/80 text-gray-600 dark:text-slate-300 hover:bg-white transition active:scale-95">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">{quiz.title}</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">{classroom.name} · {subject.name} · KKM {kkm}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowCopy(true)} disabled={attempts.length === 0}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none">
                            <ClipboardDocumentCheckIcon className="w-4 h-4" /> Salin ke Nilai
                        </button>
                    </div>

                    {flash?.success && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4">
                            <p className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                                <CheckCircleIcon className="w-5 h-5 shrink-0" /> {flash.success}
                            </p>
                        </div>
                    )}

                    {/* Ringkasan */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { label: 'Rata-rata', value: attempts.length ? avg : '-' },
                            { label: 'Tertinggi', value: attempts.length ? attempts[0].score : '-' },
                            { label: 'Terendah', value: lowest ?? '-' },
                            { label: 'Rata-rata Waktu', value: fmtDuration(avgDuration) },
                            { label: 'Mengerjakan', value: `${attempts.length}/${totalStudents}` },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-2xl p-4 text-center shadow-xl dark:shadow-none">
                                <p className="text-2xl font-black text-gray-900 dark:text-slate-100">{stat.value}</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Distribusi nilai */}
                    {attempts.length > 0 && (
                        <div className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] shadow-xl dark:shadow-none p-6">
                            <h3 className="font-extrabold text-gray-900 dark:text-slate-100 mb-4">Distribusi Nilai</h3>
                            <div className="flex items-end gap-3 h-32">
                                {buckets.map((b) => (
                                    <div key={b.label} className="flex-1 flex flex-col items-center justify-end h-full">
                                        <span className="text-xs font-black text-gray-600 dark:text-slate-300 mb-1">{b.count > 0 ? b.count : ''}</span>
                                        <motion.div
                                            className={`w-full rounded-t-lg ${b.min < 60 ? 'bg-rose-400' : b.min < 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(b.count / maxBucket) * 100}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-1">{b.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Papan peringkat */}
                    <div className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] shadow-xl dark:shadow-none overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrophyIcon className="w-5 h-5 text-amber-500" />
                                <h3 className="font-extrabold text-gray-900 dark:text-slate-100">Papan Peringkat</h3>
                            </div>
                            {remedialCount > 0 && (
                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full">
                                    {remedialCount} siswa perlu remedial (&lt; KKM {kkm})
                                </span>
                            )}
                        </div>
                        {attempts.length === 0 ? (
                            <p className="p-8 text-center text-sm text-gray-400 dark:text-slate-500">Belum ada siswa yang mengerjakan.</p>
                        ) : (
                            <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 dark:bg-slate-800/50 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 font-bold">
                                    <tr>
                                        <th className="px-6 py-3 w-12">#</th>
                                        <th className="px-6 py-3">Nama</th>
                                        <th className="px-6 py-3">Dikumpulkan</th>
                                        <th className="px-6 py-3">Lama</th>
                                        <th className="px-6 py-3 text-right">Skor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {attempts.map((a, i) => (
                                        <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                                            <td className="px-6 py-3 font-black text-gray-400 dark:text-slate-500">
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                            </td>
                                            <td className="px-6 py-3 font-semibold text-gray-800 dark:text-slate-200">
                                                {a.student?.name}
                                                {a.score < kkm && (
                                                    <span className="ml-2 text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">Remedial</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-500 dark:text-slate-400">
                                                {new Date(a.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-500 dark:text-slate-400">{fmtDuration(a.duration_seconds)}</td>
                                            <td className={`px-6 py-3 text-right font-black text-lg ${scoreColor(a.score)}`}>{a.score}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>

                    {/* Analisis per soal + distribusi pilihan */}
                    {attempts.length > 0 && (
                        <div className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] shadow-xl dark:shadow-none p-6 space-y-6">
                            <h3 className="font-extrabold text-gray-900 dark:text-slate-100">Analisis per Soal</h3>
                            {questionStats.map((stat, i) => {
                                const pct = Math.round(stat.correct / attempts.length * 100);
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{i + 1}. <MathText text={stat.q} /></p>
                                            <span className={`text-xs font-black shrink-0 ${pct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{pct}% benar</span>
                                        </div>
                                        {/* Distribusi pilihan jawaban */}
                                        <div className="space-y-1.5">
                                            {stat.options.map((opt, j) => {
                                                const count = stat.picks[j];
                                                const isKey = j === stat.answer;
                                                return (
                                                    <div key={j} className="flex items-center gap-2 text-xs">
                                                        <span className={`w-5 shrink-0 font-black ${isKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                                            {String.fromCharCode(65 + j)}{isKey ? '✓' : ''}
                                                        </span>
                                                        <div className="flex-1 h-4 bg-gray-100 dark:bg-slate-800 rounded overflow-hidden">
                                                            <div className={`h-full rounded ${isKey ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-slate-600'}`}
                                                                style={{ width: `${(count / attempts.length) * 100}%` }} />
                                                        </div>
                                                        <span className="w-24 shrink-0 truncate text-gray-500 dark:text-slate-400" title={opt}><MathText text={opt} /></span>
                                                        <span className="w-6 shrink-0 text-right font-bold text-gray-600 dark:text-slate-300">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Belum mengerjakan */}
                    {studentsNotDone.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4">
                            <p className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300 text-sm mb-2">
                                <ExclamationCircleIcon className="w-5 h-5 shrink-0" /> {studentsNotDone.length} siswa belum mengerjakan
                            </p>
                            <p className="text-sm text-amber-800/80 dark:text-amber-400/80 ml-7">
                                {studentsNotDone.map((s) => s.name).join(', ')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Salin ke Nilai */}
            <Modal show={showCopy} onClose={() => setShowCopy(false)} maxWidth="md">
                <form onSubmit={submitCopy} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Salin Skor ke Rekap Nilai</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        Skor {attempts.length} siswa akan disalin ke rekap nilai <span className="font-semibold">{subject.name}</span> kelas <span className="font-semibold">{classroom.name}</span>. Nilai lama di kolom terpilih akan ditimpa.
                    </p>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Salin ke kolom</label>
                        <select value={copyForm.data.column} onChange={(e) => copyForm.setData('column', e.target.value)}
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="tugas">Tugas</option>
                            <option value="pts">PTS</option>
                            <option value="pas">PAS</option>
                        </select>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowCopy(false)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button type="submit" disabled={copyForm.processing} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50">Salin</button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
