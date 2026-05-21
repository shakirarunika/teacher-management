import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CheckCircleIcon, CalendarIcon, UserGroupIcon, ExclamationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

// Status config with all color variants
const STATUS_CONFIG = {
    Hadir: {
        label: 'Hadir',
        active: 'bg-emerald-500 text-white',
        inactive: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/40',
        card: 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/10',
        avatar: 'from-emerald-400 to-emerald-600 text-white',
        badge: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    },
    Sakit: {
        label: 'Sakit',
        active: 'bg-amber-500 text-white',
        inactive: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-950/40',
        card: 'border-amber-200 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10',
        avatar: 'from-amber-400 to-amber-600 text-white',
        badge: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    },
    Izin: {
        label: 'Izin',
        active: 'bg-blue-500 text-white',
        inactive: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-950/40',
        card: 'border-blue-200 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/10',
        avatar: 'from-blue-400 to-blue-600 text-white',
        badge: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    },
    Alpha: {
        label: 'Alpha',
        active: 'bg-rose-500 text-white',
        inactive: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border-rose-200 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-950/40',
        card: 'border-rose-200 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/10',
        avatar: 'from-rose-400 to-rose-600 text-white',
        badge: 'bg-rose-100 dark:bg-rose-950/40 text-rose-750 dark:text-rose-350',
    },
};

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

export default function AttendanceIndex({ classroom, date, students, holiday }) {
    const { flash } = usePage().props;

    const { data, setData, processing } = useForm({
        date: date,
        attendances: students.map(s => ({
            student_id: s.id,
            status: s.status || null,
        })),
    });

    const [showToast, setShowToast] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        if (flash && flash.success) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    }, [flash]);

    // Sync form data whenever date prop changes (after Inertia navigation)
    useEffect(() => {
        setData({
            date: date,
            attendances: students.map(s => ({
                student_id: s.id,
                status: s.status || null,
            })),
        });
    }, [date]);

    const handleDateChange = (e) => {
        router.get(route('attendance.index', classroom.id), { date: e.target.value });
    };

    const handleStatusChange = (studentId, status) => {
        const updated = data.attendances.map(a =>
            a.student_id === studentId ? { ...a, status } : a
        );
        setData('attendances', updated);
    };

    const markAllPresent = () => {
        setData('attendances', data.attendances.map(a => ({ ...a, status: 'Hadir' })));
    };

    const clearAll = () => {
        setData('attendances', data.attendances.map(a => ({ ...a, status: null })));
        setShowClearConfirm(false);
    };

    const submit = (e) => {
        e.preventDefault();
        const filteredAttendances = data.attendances.filter(a => a.status !== null);
        router.post(route('attendance.store', classroom.id), {
            date: data.date,
            attendances: filteredAttendances,
        });
    };

    // Derived stats
    const filledCount = data.attendances.filter(a => a.status !== null).length;
    const unfilledCount = students.length - filledCount;
    const progressPct = students.length > 0 ? Math.round((filledCount / students.length) * 100) : 0;
    const allFilled = unfilledCount === 0 && students.length > 0;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.04 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Absensi ${classroom.name}`} />

            <div className="py-6 sm:py-8 relative z-10 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header Card */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-indigo-100/50 dark:shadow-none mb-6 transition-colors duration-300"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div>
                                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
                                    <UserGroupIcon className="w-6 h-6" />
                                    <span className="font-bold uppercase tracking-wider text-sm">Attendance Input</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{classroom.name}</h2>
                                <p className="text-gray-500 dark:text-slate-400 font-medium mt-1">{students.length} Students Enrolled</p>
                            </div>

                            <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-950/50 p-2 rounded-2xl border border-white dark:border-slate-850 shadow-inner">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <CalendarIcon className="w-6 h-6" />
                                </div>
                                <input
                                    type="date"
                                    value={data.date}
                                    onChange={handleDateChange}
                                    className="bg-transparent border-none focus:ring-0 text-gray-800 dark:text-slate-200 font-bold px-2 py-1 cursor-pointer text-lg focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                                    Progress Pengisian
                                </span>
                                <motion.span
                                    key={filledCount}
                                    initial={{ scale: 1.3 }}
                                    animate={{ scale: 1 }}
                                    className={`text-sm font-black tabular-nums transition-colors ${allFilled ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'}`}
                                >
                                    {filledCount} / {students.length} siswa
                                </motion.span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${allFilled ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-xs text-gray-400 dark:text-slate-500">{progressPct}% selesai</span>
                                {allFilled && (
                                    <motion.span
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                                    >
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        Semua terisi!
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Holiday Warning Card */}
                    <AnimatePresence>
                        {holiday && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mb-6 p-5 rounded-[2rem] border-2 shadow-lg flex items-start gap-4 transition-colors duration-300 ${
                                    holiday.type === 'Nasional'
                                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
                                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300'
                                }`}
                            >
                                <div className={`p-3 rounded-2xl flex-shrink-0 transition-colors duration-300 ${
                                    holiday.type === 'Nasional' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-450' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-450'
                                }`}>
                                    <CalendarIcon className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-lg">Hari Libur Terdeteksi</h3>
                                    <p className="text-sm font-semibold opacity-90">
                                        Tanggal {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} adalah <span className="font-bold">Hari Libur {holiday.type} ({holiday.name})</span>.
                                    </p>
                                    <p className="text-xs font-semibold opacity-75">
                                        Absensi di hari libur biasanya tidak diperlukan, namun Anda tetap dapat melakukan pencatatan jika diperlukan.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mb-4">
                        <motion.button
                            type="button"
                            onClick={() => setShowClearConfirm(true)}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold py-2 px-4 rounded-xl transition-colors shadow-sm text-sm flex items-center gap-2 border border-rose-200 dark:border-rose-900/30"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Clear All
                        </motion.button>
                        <motion.button
                            type="button"
                            onClick={markAllPresent}
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-indigo-100 dark:bg-indigo-950/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold py-2 px-4 rounded-xl transition-colors shadow-sm text-sm flex items-center gap-2 border border-transparent dark:border-indigo-900/30"
                        >
                            <CheckIcon className="w-4 h-4" />
                            Mark All Present
                        </motion.button>
                    </div>

                    <form onSubmit={submit} className="pb-36 sm:pb-28">
                        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                            {students.map((student, index) => {
                                const currentStatus = data.attendances.find(a => a.student_id === student.id)?.status;
                                const cfg = currentStatus ? STATUS_CONFIG[currentStatus] : null;

                                return (
                                    <motion.div
                                        variants={itemVariants}
                                        key={student.id}
                                        layout
                                        className={`backdrop-blur-xl border-2 rounded-3xl p-5 shadow-md transition-all duration-300 ${
                                            cfg
                                                ? `${cfg.card} shadow-gray-100/80 dark:shadow-none`
                                                : 'bg-white/70 dark:bg-slate-900/45 border-white dark:border-slate-800/80 shadow-gray-200/50 dark:shadow-none hover:bg-white/90 dark:hover:bg-slate-900/50'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                            {/* Student Info */}
                                            <div className="flex items-center gap-4">
                                                <motion.div
                                                    layout
                                                    className={`w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center font-black shadow-inner text-base transition-all duration-300 ${
                                                        cfg
                                                            ? cfg.avatar
                                                            : 'from-indigo-105 dark:from-indigo-950 to-purple-105 dark:to-purple-950 text-indigo-600 dark:text-indigo-400 border border-transparent dark:border-indigo-900/30'
                                                    }`}
                                                >
                                                    {currentStatus ? (
                                                        <motion.span
                                                            key={currentStatus}
                                                            initial={{ scale: 0, rotate: -15 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                        >
                                                            <CheckIcon className="w-5 h-5" />
                                                        </motion.span>
                                                    ) : (
                                                        <span>{index + 1}</span>
                                                    )}
                                                </motion.div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg leading-tight">{student.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-sm font-medium text-gray-550 dark:text-slate-400">NIS: {student.nis}</p>
                                                        <AnimatePresence mode="wait">
                                                            {currentStatus ? (
                                                                <motion.span
                                                                    key={currentStatus}
                                                                    initial={{ opacity: 0, scale: 0.7, x: -6 }}
                                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.7, x: 6 }}
                                                                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}
                                                                >
                                                                    {currentStatus}
                                                                </motion.span>
                                                            ) : (
                                                                <motion.span
                                                                    key="belum"
                                                                    initial={{ opacity: 0, scale: 0.7 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.7 }}
                                                                    className="text-xs font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-0.5"
                                                                >
                                                                    <ExclamationCircleIcon className="w-3.5 h-3.5" />
                                                                    Belum diisi
                                                                </motion.span>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Buttons */}
                                            <div className="flex sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                                                {STATUS_OPTIONS.map((val) => {
                                                    const isSelected = currentStatus === val;
                                                    const optCfg = STATUS_CONFIG[val];
                                                    return (
                                                        <motion.button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handleStatusChange(student.id, val)}
                                                            whileTap={{ scale: 0.92 }}
                                                            whileHover={{ scale: 1.05 }}
                                                            className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm border-2 flex items-center gap-1.5 transition-all duration-200 ${
                                                                isSelected
                                                                    ? `${optCfg.active} border-transparent shadow-lg`
                                                                    : `${optCfg.inactive}`
                                                            }`}
                                                        >
                                                            <AnimatePresence mode="wait">
                                                                {isSelected && (
                                                                    <motion.span
                                                                        key="check"
                                                                        initial={{ scale: 0, rotate: -20 }}
                                                                        animate={{ scale: 1, rotate: 0 }}
                                                                        exit={{ scale: 0 }}
                                                                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                                    >
                                                                        <CheckIcon className="w-3.5 h-3.5" />
                                                                    </motion.span>
                                                                )}
                                                            </AnimatePresence>
                                                            {val}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* Floating Save Bar */}
                        <div className="fixed bottom-24 sm:bottom-8 left-0 right-0 px-4 sm:max-w-4xl sm:mx-auto z-40 pointer-events-none">
                            <AnimatePresence>
                                {unfilledCount > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="mb-3 pointer-events-auto text-center"
                                    >
                                        <span className="inline-flex items-center gap-1.5 bg-amber-105 dark:bg-amber-950/80 text-amber-705 dark:text-amber-300 text-sm font-semibold px-4 py-2 rounded-full shadow border border-amber-200 dark:border-amber-900/30 backdrop-blur-md">
                                            <ExclamationCircleIcon className="w-4 h-4" />
                                            {unfilledCount} siswa belum diisi — tidak akan tersimpan
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <motion.button
                                type="submit"
                                disabled={processing || students.length === 0}
                                whileTap={{ scale: 0.97 }}
                                className={`w-full pointer-events-auto font-black text-lg py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] dark:shadow-none transition-all flex items-center justify-center gap-2 ${
                                    allFilled
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none'
                                        : 'bg-gray-900 dark:bg-slate-850 hover:bg-indigo-600 dark:hover:bg-indigo-750 text-white dark:text-slate-100 border dark:border-slate-800'
                                }`}
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Menyimpan...
                                    </span>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-6 h-6" />
                                        {allFilled ? 'Simpan Absensi ✓' : 'Save Attendance'}
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-20 right-4 sm:top-8 sm:right-8 z-50 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
                    >
                        <CheckCircleIcon className="w-6 h-6" />
                        Attendance saved successfully!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clear All Confirmation Modal */}
            <AnimatePresence>
                {showClearConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-slate-950/60 backdrop-blur-sm"
                        onClick={() => setShowClearConfirm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 24 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-transparent dark:border-slate-800/80"
                            onClick={e => e.stopPropagation()}
                        >
                            <motion.div
                                animate={{ rotate: [0, -8, 8, -4, 0] }}
                                transition={{ duration: 0.5, delay: 0.15 }}
                                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 mx-auto mb-5 text-rose-500 dark:text-rose-400"
                            >
                                <TrashIcon className="w-7 h-7" />
                            </motion.div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 text-center mb-2">Clear Semua Status?</h3>
                            <p className="text-gray-500 dark:text-slate-400 text-center text-sm mb-6">
                                Semua status absensi akan dikosongkan.<br />Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <motion.button
                                    type="button"
                                    onClick={() => setShowClearConfirm(false)}
                                    whileTap={{ scale: 0.96 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 bg-transparent"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                    Batal
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={clearAll}
                                    whileTap={{ scale: 0.96 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg dark:shadow-none shadow-rose-200"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Ya, Clear
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </AuthenticatedLayout>
    );
}
