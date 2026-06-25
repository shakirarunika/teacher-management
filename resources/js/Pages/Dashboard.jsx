import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ClipboardDocumentCheckIcon, CheckCircleIcon, ExclamationCircleIcon, PlusIcon, PencilSquareIcon, TrashIcon, UsersIcon, BookOpenIcon } from '@heroicons/react/24/outline';

// Dynamic badge based on rate value
function AttendanceBadge({ rate }) {
    if (rate >= 90) return <span className="text-sm font-bold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40 px-2 py-1 rounded-lg mb-1">Excellent</span>;
    if (rate >= 75) return <span className="text-sm font-bold text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40 px-2 py-1 rounded-lg mb-1">Good</span>;
    if (rate >= 60) return <span className="text-sm font-bold text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40 px-2 py-1 rounded-lg mb-1">Cukup</span>;
    return <span className="text-sm font-bold text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-950/40 px-2 py-1 rounded-lg mb-1">Perlu Perhatian</span>;
}

// Animated count-up number
function CountUp({ value, duration = 1.2 }) {
    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {value}
        </motion.span>
    );
}

export default function Dashboard({ stats, classrooms, academicYear, subjects = [] }) {
    const recordedToday = classrooms.filter(c => c.attendance_today.recorded).length;
    const unrecordedToday = classrooms.length - recordedToday;

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };
    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    };

    // Modal tambah/edit kelas
    const [classModal, setClassModal] = useState({ open: false, editing: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const form = useForm({ name: '' });

    // Refresh data dashboard setelah mutasi (redirect back() Inertia v2 tidak selalu re-apply list)
    const refreshClasses = () => router.reload({ only: ['classrooms', 'stats'] });

    const openCreate = () => { form.clearErrors(); form.setData('name', ''); setClassModal({ open: true, editing: null }); };
    const openEdit = (classroom) => { form.clearErrors(); form.setData('name', classroom.name); setClassModal({ open: true, editing: classroom }); };
    const closeModal = () => setClassModal({ open: false, editing: null });

    const submitClass = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { closeModal(); refreshClasses(); } };
        if (classModal.editing) {
            form.put(route('classrooms.update', classModal.editing.id), opts);
        } else {
            form.post(route('classrooms.store'), opts);
        }
    };

    const confirmDelete = () => {
        router.delete(route('classrooms.destroy', deleteTarget.id), {
            preserveScroll: true,
            onSuccess: refreshClasses,
            onFinish: () => setDeleteTarget(null),
        });
    };

    // Kelola mata pelajaran (master data guru, global per guru)
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [confirmDelSubject, setConfirmDelSubject] = useState(null);
    const subjectForm = useForm({ name: '', code: '' });

    const resetSubjectForm = () => { subjectForm.reset(); subjectForm.clearErrors(); setEditingSubjectId(null); };
    const startEditSubject = (s) => { subjectForm.clearErrors(); subjectForm.setData({ name: s.name, code: s.code || '' }); setEditingSubjectId(s.id); };
    const submitSubject = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { resetSubjectForm(); router.reload({ only: ['subjects'] }); } };
        if (editingSubjectId) subjectForm.put(route('subjects.update', editingSubjectId), opts);
        else subjectForm.post(route('subjects.store'), opts);
    };
    const deleteSubject = (id) => {
        router.delete(route('subjects.destroy', id), {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['subjects'] }),
            onFinish: () => setConfirmDelSubject(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="py-2 sm:py-8 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* Stats Grid */}
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                        {/* Total Students */}
                        <motion.div variants={item} className="col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl shadow-purple-500/30 border border-white/20">
                            <h3 className="font-bold opacity-80 tracking-wide uppercase text-xs sm:text-sm">Total Siswa</h3>
                            <p className="text-4xl sm:text-5xl font-black mt-2 tracking-tighter">
                                <CountUp value={stats.totalStudents} />
                            </p>
                            <div className="mt-4 h-1 w-12 bg-white/30 rounded-full" />
                        </motion.div>

                        {/* Active Classes */}
                        <motion.div variants={item} className="col-span-1 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl shadow-teal-500/30 border border-white/20">
                            <h3 className="font-bold opacity-80 tracking-wide uppercase text-xs sm:text-sm">Kelas Aktif</h3>
                            <p className="text-4xl sm:text-5xl font-black mt-2 tracking-tighter">
                                <CountUp value={stats.totalClassrooms} />
                            </p>
                            <div className="mt-4 h-1 w-12 bg-white/30 rounded-full" />
                        </motion.div>

                        {/* Overall Attendance with animated bar */}
                        <motion.div variants={item} className="col-span-1 bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 text-gray-800 dark:text-slate-200 shadow-xl shadow-indigo-100/50 dark:shadow-none flex flex-col justify-center transition-all duration-300">
                            <h3 className="font-bold tracking-wide uppercase text-xs sm:text-sm text-indigo-900 dark:text-indigo-300">Kehadiran</h3>
                            <div className="mt-3 flex items-end gap-2">
                                <p className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-slate-100 tracking-tighter">{stats.attendanceRate}%</p>
                                <AttendanceBadge rate={stats.attendanceRate} />
                            </div>
                            <div className="mt-3 w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    className="h-2 rounded-full bg-indigo-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.attendanceRate}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                                />
                            </div>
                        </motion.div>

                        {/* NEW: Absen Hari Ini */}
                        <motion.div
                            variants={item}
                            className={`col-span-1 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl border border-white/20 flex flex-col justify-between ${
                                unrecordedToday === 0
                                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30 dark:shadow-none'
                                    : 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/30 dark:shadow-none'
                            }`}
                        >
                            <h3 className="font-bold opacity-80 tracking-wide uppercase text-xs sm:text-sm">Absen Hari Ini</h3>
                            <div className="mt-2">
                                <p className="text-4xl sm:text-5xl font-black tracking-tighter">
                                    {recordedToday}<span className="text-2xl opacity-60">/{stats.totalClassrooms}</span>
                                </p>
                                <p className="text-xs sm:text-sm opacity-80 font-semibold mt-1">
                                    {unrecordedToday === 0
                                        ? '✅ Semua kelas sudah absen!'
                                        : `⚠️ ${unrecordedToday} kelas belum diabsen`}
                                </p>
                            </div>
                            <div className="mt-3 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                    className="h-1.5 rounded-full bg-white/70"
                                    initial={{ width: 0 }}
                                    animate={{ width: stats.totalClassrooms > 0 ? `${(recordedToday / stats.totalClassrooms) * 100}%` : '0%' }}
                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                                />
                            </div>
                        </motion.div>

                    </motion.div>

                    {/* Classrooms Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-6 gap-3">
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">Kelas Anda</h3>
                            <div className="flex items-center gap-3">
                                <span className="hidden sm:inline bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 py-1 px-4 rounded-full text-xs sm:text-sm font-bold shadow-sm">
                                    TA {academicYear}
                                </span>
                                <button
                                    onClick={() => setShowSubjectModal(true)}
                                    className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-slate-900/45 border border-gray-200 dark:border-slate-800/80 hover:bg-white text-gray-700 dark:text-slate-200 font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95"
                                >
                                    <BookOpenIcon className="w-4 h-4" /> Kelola Mapel
                                </button>
                                <button
                                    onClick={openCreate}
                                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95"
                                >
                                    <PlusIcon className="w-4 h-4" /> Tambah Kelas
                                </button>
                            </div>
                        </div>

                        {classrooms.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-xl dark:shadow-none"
                            >
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ClipboardDocumentCheckIcon className="w-8 h-8 text-indigo-300 dark:text-indigo-400" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-400 dark:text-slate-400">Belum ada kelas</h4>
                                <p className="text-gray-400 dark:text-slate-500 mt-1 text-sm">Mulai dengan menambahkan kelas pertama Anda.</p>
                                <button
                                    onClick={openCreate}
                                    className="mt-5 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-5 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95"
                                >
                                    <PlusIcon className="w-4 h-4" /> Tambah Kelas
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key={classrooms.map((c) => c.id).join('_')} variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                                {classrooms.map((classroom) => {
                                    const isRecorded = classroom.attendance_today.recorded;
                                    const presentPct = classroom.students_count > 0
                                        ? Math.round((classroom.attendance_today.present / classroom.students_count) * 100)
                                        : 0;

                                    return (
                                        <motion.div
                                            variants={item}
                                            key={classroom.id}
                                            className="group relative bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-7 shadow-xl shadow-gray-200/50 dark:shadow-none hover:bg-white/90 dark:hover:bg-slate-900/50 hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-1 flex flex-col"
                                        >
                                            {/* Student count badge */}
                                            <div className="absolute top-6 right-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md shadow-rose-200 dark:shadow-none">
                                                {classroom.students_count} Siswa
                                            </div>

                                            {/* Class icon */}
                                            <div className="h-14 w-14 bg-gradient-to-br from-indigo-100 dark:from-indigo-950 to-purple-100 dark:to-purple-950 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                                <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>

                                            <h4 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors">
                                                {classroom.name}
                                            </h4>

                                            {/* Attendance status */}
                                            <div className="mt-3 mb-4">
                                                {isRecorded ? (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                                                {classroom.attendance_today.present}/{classroom.students_count} Hadir
                                                            </span>
                                                            <span className="text-xs font-bold text-gray-400 dark:text-slate-400">{presentPct}%</span>
                                                        </div>
                                                        {/* Mini progress bar */}
                                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full rounded-full bg-emerald-500"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${presentPct}%` }}
                                                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/40 px-3 py-1.5 rounded-full animate-pulse">
                                                        <ExclamationCircleIcon className="w-3.5 h-3.5" />
                                                        Belum diabsen hari ini
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="mt-auto flex flex-col sm:flex-row gap-2">
                                                <Link
                                                    href={`/classrooms/${classroom.id}/attendance`}
                                                    className="flex-1 bg-gray-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-center font-bold py-2.5 px-3 rounded-xl transition-all shadow-md hover:shadow-indigo-500/30 dark:shadow-none active:scale-95 block text-sm"
                                                >
                                                    Absensi
                                                </Link>
                                                <Link
                                                    href={`/classrooms/${classroom.id}/scores`}
                                                    className="flex-1 bg-indigo-50 dark:bg-indigo-950/45 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-center font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95 block text-sm"
                                                >
                                                    Nilai
                                                </Link>
                                                <Link
                                                    href={`/classrooms/${classroom.id}/attendance/report`}
                                                    className="flex-1 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-850 text-gray-600 dark:text-slate-350 text-center border-2 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95 block text-sm"
                                                >
                                                    Laporan
                                                </Link>
                                            </div>

                                            {/* Kelola kelas & siswa */}
                                            <div className="mt-2 flex items-center gap-2">
                                                <Link
                                                    href={`/classrooms/${classroom.id}/students`}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95 text-sm"
                                                >
                                                    <UsersIcon className="w-4 h-4" /> Kelola Siswa
                                                </Link>
                                                <button
                                                    onClick={() => openEdit(classroom)}
                                                    title="Edit nama kelas"
                                                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition-all active:scale-95"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(classroom)}
                                                    title="Hapus kelas"
                                                    className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-all active:scale-95"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>

                </div>
            </div>

            {/* Modal Tambah/Edit Kelas */}
            <Modal show={classModal.open} onClose={closeModal} maxWidth="md">
                <form onSubmit={submitClass} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        {classModal.editing ? 'Edit Kelas' : 'Tambah Kelas Baru'}
                    </h2>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nama Kelas</label>
                        <input
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="Contoh: Kelas 10A"
                            autoFocus
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        {form.errors.name && <p className="mt-1 text-sm text-rose-600">{form.errors.name}</p>}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50">
                            {classModal.editing ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus Kelas */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Hapus kelas "{deleteTarget?.name}"?</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        Semua data absensi & nilai di kelas ini akan ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-white shadow-md shadow-rose-500/30 transition">Ya, Hapus</button>
                    </div>
                </div>
            </Modal>

            {/* Modal Kelola Mata Pelajaran */}
            <Modal show={showSubjectModal} onClose={() => { setShowSubjectModal(false); resetSubjectForm(); setConfirmDelSubject(null); }} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Kelola Mata Pelajaran</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Mapel berlaku untuk semua kelas Anda. Tambah, ubah, atau hapus di sini.</p>

                    <form onSubmit={submitSubject} className="mt-4 flex items-start gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={subjectForm.data.name}
                                onChange={(e) => subjectForm.setData('name', e.target.value)}
                                placeholder="Nama mapel (mis. Matematika)"
                                className="block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {subjectForm.errors.name && <p className="mt-1 text-sm text-rose-600">{subjectForm.errors.name}</p>}
                        </div>
                        <input
                            type="text"
                            value={subjectForm.data.code}
                            onChange={(e) => subjectForm.setData('code', e.target.value)}
                            placeholder="Kode"
                            className="w-20 rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-3 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button type="submit" disabled={subjectForm.processing} className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition disabled:opacity-50 shrink-0">
                            {editingSubjectId ? 'Simpan' : 'Tambah'}
                        </button>
                        {editingSubjectId && (
                            <button type="button" onClick={resetSubjectForm} className="px-3 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 font-bold text-sm transition shrink-0">×</button>
                        )}
                    </form>

                    <div className="mt-4 max-h-72 overflow-auto divide-y divide-gray-100 dark:divide-slate-800 border-t border-gray-100 dark:border-slate-800">
                        {subjects.length === 0 && (
                            <p className="py-6 text-center text-sm text-gray-400 dark:text-slate-500">Belum ada mata pelajaran.</p>
                        )}
                        {subjects.map((s) => (
                            <div key={s.id} className="flex items-center justify-between py-2.5">
                                <span className="font-semibold text-gray-800 dark:text-slate-200">
                                    {s.name}
                                    {s.code && <span className="ml-2 text-xs font-mono text-gray-400">{s.code}</span>}
                                </span>
                                {confirmDelSubject === s.id ? (
                                    <span className="flex items-center gap-2 text-sm">
                                        <span className="text-rose-600 font-semibold">Hapus + nilainya?</span>
                                        <button onClick={() => deleteSubject(s.id)} className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs">Ya</button>
                                        <button onClick={() => setConfirmDelSubject(null)} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold text-xs">Batal</button>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <button onClick={() => startEditSubject(s)} title="Edit" className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition">
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setConfirmDelSubject(s.id)} title="Hapus" className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button onClick={() => { setShowSubjectModal(false); resetSubjectForm(); setConfirmDelSubject(null); }} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Tutup</button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
