import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentPlusIcon, UserIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState, useCallback } from 'react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

// Color coding for final score
function ScoreBadge({ score }) {
    if (score >= 90) return { bg: 'text-emerald-600 dark:text-emerald-400', label: 'A' };
    if (score >= 80) return { bg: 'text-blue-600 dark:text-blue-400', label: 'B' };
    if (score >= 70) return { bg: 'text-indigo-600 dark:text-indigo-400', label: 'C' };
    if (score >= 60) return { bg: 'text-amber-600 dark:text-amber-400', label: 'D' };
    return { bg: 'text-rose-600 dark:text-rose-400', label: 'E' };
}

function FinalScoreDisplay({ score, isPenalty }) {
    const badge = ScoreBadge({ score });
    return (
        <div className="flex flex-col items-center lg:items-end">
            <motion.div
                key={score}
                initial={{ scale: 1.2, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`text-3xl font-black tabular-nums ${isPenalty ? 'text-rose-500 dark:text-rose-400' : badge.bg}`}
            >
                {score}
            </motion.div>
            <div className="flex items-center gap-1 mt-0.5">
                {isPenalty ? (
                    <span className="text-[10px] font-bold text-rose-500 dark:text-rose-455 uppercase tracking-wider">Penalti Alpha</span>
                ) : (
                    <span className={`text-xs font-black ${badge.bg}`}>{badge.label}</span>
                )}
            </div>
        </div>
    );
}

export default function ScoreIndex({ classroom, subjects, students, existingScores, attendanceStats, filters }) {
    const [selectedSubject, setSelectedSubject] = useState(filters.subject_id || (subjects.length > 0 ? subjects[0].id : null));
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Local score state for live updates
    const [scores, setScores] = useState(() =>
        students.map(student => ({
            student_id: student.id,
            tugas: existingScores[student.id]?.tugas ?? '',
            pts: existingScores[student.id]?.pts ?? '',
            pas: existingScores[student.id]?.pas ?? '',
        }))
    );

    // Sync when subject changes (props update)
    useEffect(() => {
        setScores(students.map(student => ({
            student_id: student.id,
            tugas: existingScores[student.id]?.tugas ?? '',
            pts: existingScores[student.id]?.pts ?? '',
            pas: existingScores[student.id]?.pas ?? '',
        })));
    }, [existingScores]);

    // Navigate on subject change
    useEffect(() => {
        if (selectedSubject && selectedSubject !== filters.subject_id) {
            router.get(route('scores.index', classroom.id), { subject_id: selectedSubject }, {
                preserveState: false, preserveScroll: true, replace: true,
            });
        }
    }, [selectedSubject]);

    const handleScoreChange = useCallback((studentId, field, value) => {
        if (value === '') {
            setScores(prev => prev.map(s => s.student_id === studentId ? { ...s, [field]: '' } : s));
            return;
        }
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0 && num <= 100) {
            setScores(prev => prev.map(s => s.student_id === studentId ? { ...s, [field]: num } : s));
        }
    }, []);

    // Live final score calculation
    const calculateFinalScore = useCallback((studentId) => {
        const stats = attendanceStats[studentId];
        const studentScoreData = scores.find(s => s.student_id === studentId);
        if (!studentScoreData) return 0;

        if (stats && stats.total_alpha >= 3) return 76;

        const kehadiranScore = stats?.kehadiran_score ?? 0;
        const tugas = studentScoreData.tugas !== '' ? parseInt(studentScoreData.tugas) : 0;
        const pts = studentScoreData.pts !== '' ? parseInt(studentScoreData.pts) : 0;
        const pas = studentScoreData.pas !== '' ? parseInt(studentScoreData.pas) : 0;

        return Math.round((kehadiranScore * 0.3) + (tugas * 0.2) + (pts * 0.1) + (pas * 0.4));
    }, [scores, attendanceStats]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('scores.store', classroom.id), {
            subject_id: selectedSubject,
            scores,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            },
            onFinish: () => setProcessing(false),
        });
    };

    // Summary stats
    const filledCount = scores.filter(s => s.tugas !== '' || s.pts !== '' || s.pas !== '').length;
    const avgFinal = students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + calculateFinalScore(s.id), 0) / students.length)
        : 0;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.04 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
    };

    const currentSubjectName = subjects.find(s => s.id === selectedSubject)?.name ?? '—';

    return (
        <AuthenticatedLayout>
            <Head title={`Nilai ${classroom.name} - SINTESIS`} />

            <form onSubmit={handleSubmit} className="py-6 sm:py-8 relative z-10 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-36">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-indigo-100/50 dark:shadow-none mb-6 relative z-50 transition-colors duration-300"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
                                    <DocumentPlusIcon className="w-6 h-6" />
                                    <span className="font-bold uppercase tracking-wider text-sm">Input Nilai</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{classroom.name}</h2>
                                <p className="text-gray-500 dark:text-slate-400 font-medium mt-1 text-sm">
                                    Kehadiran (30%) + Tugas (20%) + PTS (10%) + PAS (40%)
                                </p>

                                {/* Live summary chips */}
                                {selectedSubject && students.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                            <CheckCircleIcon className="w-3.5 h-3.5" />
                                            {filledCount}/{students.length} siswa terisi
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                            Rata-rata: {avgFinal}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                                            avgFinal >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                                            avgFinal >= 70 ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' :
                                            avgFinal >= 60 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                                            'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                        }`}>
                                            {avgFinal >= 80 ? '🎯 Sangat Baik' : avgFinal >= 70 ? '👍 Baik' : avgFinal >= 60 ? '⚠️ Cukup' : '❗ Perlu Perhatian'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Subject dropdown */}
                            <div className="w-full lg:w-72 flex-shrink-0">
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mata Pelajaran</p>
                                <Listbox value={selectedSubject} onChange={setSelectedSubject}>
                                    <div className="relative">
                                        <Listbox.Button className="relative w-full cursor-pointer rounded-2xl bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl py-3.5 pl-5 pr-10 text-left border border-gray-200 dark:border-slate-800/80 shadow-sm dark:shadow-none text-gray-800 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
                                            <span className="block truncate font-bold text-gray-800 dark:text-slate-200">
                                                {currentSubjectName}
                                            </span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                                            </span>
                                        </Listbox.Button>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-2 text-base border border-white/20 dark:border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-none ring-1 ring-black/5 dark:ring-white/10 focus:outline-none sm:text-sm z-[100]">
                                                {subjects.map((subject) => (
                                                    <Listbox.Option
                                                        key={subject.id}
                                                        className={({ active }) =>
                                                            `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-slate-300'}`
                                                        }
                                                        value={subject.id}
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-black text-indigo-600 dark:text-indigo-400' : 'font-medium'}`}>
                                                                    {subject.name}
                                                                </span>
                                                                {selected && (
                                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                                                                        <CheckIcon className="h-5 w-5" />
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </Listbox>
                            </div>
                        </div>
                    </motion.div>

                    {/* No subject selected */}
                    {!selectedSubject ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-xl dark:shadow-none"
                        >
                            <DocumentPlusIcon className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-500 dark:text-slate-300">Pilih Mata Pelajaran</h3>
                            <p className="text-gray-400 dark:text-slate-500 mt-1 text-sm">Pilih mata pelajaran untuk mulai memasukkan nilai.</p>
                        </motion.div>
                    ) : students.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-xl dark:shadow-none"
                        >
                            <UserIcon className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-500 dark:text-slate-300">Belum Ada Siswa</h3>
                            <p className="text-gray-400 dark:text-slate-500 mt-1 text-sm">Tambahkan siswa ke kelas ini untuk mulai menilai.</p>
                        </motion.div>
                    ) : (
                        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-3">
                            {/* Desktop column headers */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 pb-1 text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                <div className="col-span-3">Nama Siswa</div>
                                <div className="col-span-2 text-center text-emerald-500 dark:text-emerald-400">Kehadiran (30%)</div>
                                <div className="col-span-2 text-center text-indigo-500 dark:text-indigo-400">Tugas (20%)</div>
                                <div className="col-span-1 text-center text-blue-500 dark:text-blue-400">PTS (10%)</div>
                                <div className="col-span-2 text-center text-purple-500 dark:text-purple-400">PAS (40%)</div>
                                <div className="col-span-2 text-right text-gray-500 dark:text-slate-400">Nilai Akhir</div>
                            </div>

                            {students.map((student, idx) => {
                                const studentScoreData = scores.find(s => s.student_id === student.id);
                                const stats = attendanceStats[student.id];
                                const isAlphaWarning = stats?.total_alpha >= 3;
                                const finalScore = calculateFinalScore(student.id);

                                return (
                                    <motion.div
                                        variants={itemVariants}
                                        key={student.id}
                                        className={`backdrop-blur-xl border-2 rounded-3xl p-5 lg:px-6 shadow-md transition-all flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4 relative overflow-hidden ${
                                            isAlphaWarning
                                                ? 'border-rose-200 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/20 shadow-none'
                                                : 'border-white dark:border-slate-850/80 bg-white/70 dark:bg-slate-900/45 hover:bg-white/90 dark:hover:bg-slate-900/60 shadow-gray-200/50 dark:shadow-none'
                                        }`}
                                    >
                                        {/* Student Info */}
                                        <div className="col-span-3 flex items-center gap-3 relative z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm shadow-inner border ${
                                                isAlphaWarning
                                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                                                    : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40'
                                            }`}>
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm leading-tight truncate">{student.name}</h3>
                                                <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-0.5">NIS: {student.nis}</p>
                                                {isAlphaWarning && (
                                                    <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                                                        <ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />
                                                        Alpha {stats.total_alpha}x — Penalti aktif
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Kehadiran (read-only) */}
                                        <div className="col-span-2 flex flex-col lg:items-center relative z-10">
                                            <span className="lg:hidden text-xs font-bold text-emerald-500 dark:text-emerald-400 mb-1 uppercase tracking-wider">Kehadiran (30%)</span>
                                            <div className="w-full lg:w-24 text-center text-lg font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-xl py-2.5 select-none">
                                                {stats?.kehadiran_score ?? 0}
                                            </div>
                                        </div>

                                        {/* Tugas */}
                                        <div className="col-span-2 flex flex-col lg:items-center relative z-10">
                                            <span className="lg:hidden text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-wider">Tugas (20%)</span>
                                            <input
                                                type="number" min="0" max="100"
                                                placeholder="—"
                                                value={studentScoreData?.tugas ?? ''}
                                                onChange={(e) => handleScoreChange(student.id, 'tugas', e.target.value)}
                                                className="w-full lg:w-24 text-center text-lg font-black text-indigo-900 dark:text-indigo-200 bg-white/50 dark:bg-slate-950/45 border-2 border-indigo-100 dark:border-slate-800/80 rounded-xl focus:ring-0 focus:border-indigo-400 dark:focus:border-indigo-600 py-2.5 shadow-sm placeholder-gray-200 dark:placeholder-slate-800 transition-all outline-none"
                                            />
                                        </div>

                                        {/* PTS */}
                                        <div className="col-span-1 flex flex-col lg:items-center relative z-10">
                                            <span className="lg:hidden text-xs font-bold text-blue-500 dark:text-blue-400 mb-1 uppercase tracking-wider">PTS (10%)</span>
                                            <input
                                                type="number" min="0" max="100"
                                                placeholder="—"
                                                value={studentScoreData?.pts ?? ''}
                                                onChange={(e) => handleScoreChange(student.id, 'pts', e.target.value)}
                                                className="w-full lg:w-20 text-center text-lg font-black text-blue-900 dark:text-blue-200 bg-white/50 dark:bg-slate-950/45 border-2 border-blue-100 dark:border-slate-800/80 rounded-xl focus:ring-0 focus:border-blue-400 dark:focus:border-blue-600 py-2.5 shadow-sm placeholder-gray-200 dark:placeholder-slate-800 transition-all outline-none"
                                            />
                                        </div>

                                        {/* PAS */}
                                        <div className="col-span-2 flex flex-col lg:items-center relative z-10">
                                            <span className="lg:hidden text-xs font-bold text-purple-500 dark:text-purple-400 mb-1 uppercase tracking-wider">PAS (40%)</span>
                                            <input
                                                type="number" min="0" max="100"
                                                placeholder="—"
                                                value={studentScoreData?.pas ?? ''}
                                                onChange={(e) => handleScoreChange(student.id, 'pas', e.target.value)}
                                                className="w-full lg:w-24 text-center text-lg font-black text-purple-900 dark:text-purple-200 bg-white/50 dark:bg-slate-950/45 border-2 border-purple-100 dark:border-slate-800/80 rounded-xl focus:ring-0 focus:border-purple-400 dark:focus:border-purple-600 py-2.5 shadow-sm placeholder-gray-200 dark:placeholder-slate-800 transition-all outline-none"
                                            />
                                        </div>

                                        {/* Final Score — live update */}
                                        <div className="col-span-2 flex flex-col lg:items-end justify-center relative z-10 pt-3 border-t border-gray-100 dark:border-slate-800 lg:border-t-0 lg:pt-0">
                                            <span className="lg:hidden text-xs font-black text-gray-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Nilai Akhir</span>
                                            <FinalScoreDisplay score={finalScore} isPenalty={isAlphaWarning} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </div>

                {/* Floating Save Button */}
                <div className="fixed bottom-20 sm:bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/90 dark:via-slate-950/90 to-transparent z-50 pointer-events-none transition-colors duration-300">
                    <div className="max-w-7xl mx-auto flex justify-end pointer-events-auto">
                        <motion.button
                            type="submit"
                            disabled={processing || students.length === 0 || !selectedSubject}
                            whileTap={{ scale: 0.97 }}
                            whileHover={{ scale: 1.01 }}
                            className="w-full sm:w-auto bg-gray-900 dark:bg-slate-850 hover:bg-indigo-600 dark:hover:bg-indigo-750 text-white dark:text-slate-100 font-bold py-4 px-10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] dark:shadow-none hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border dark:border-slate-800"
                        >
                            {processing ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 animate-spin flex-shrink-0" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>Simpan Nilai</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </form>

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-20 right-4 sm:top-8 sm:right-8 z-[100] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
                    >
                        <CheckCircleIcon className="w-6 h-6" />
                        Nilai berhasil disimpan!
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthenticatedLayout>
    );
}
