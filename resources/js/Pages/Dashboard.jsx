import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ClipboardDocumentCheckIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Dynamic badge based on rate value
function AttendanceBadge({ rate }) {
    if (rate >= 90) return <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg mb-1">Excellent</span>;
    if (rate >= 75) return <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg mb-1">Good</span>;
    if (rate >= 60) return <span className="text-sm font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg mb-1">Cukup</span>;
    return <span className="text-sm font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-lg mb-1">Perlu Perhatian</span>;
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

export default function Dashboard({ stats, classrooms, academicYear }) {
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

    return (
        <AuthenticatedLayout>
            <Head title="Teacher Dashboard" />

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
                        <motion.div variants={item} className="col-span-1 bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-6 sm:p-8 text-gray-800 shadow-xl shadow-indigo-100/50 flex flex-col justify-center">
                            <h3 className="font-bold tracking-wide uppercase text-xs sm:text-sm text-indigo-900">Kehadiran</h3>
                            <div className="mt-3 flex items-end gap-2">
                                <p className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter">{stats.attendanceRate}%</p>
                                <AttendanceBadge rate={stats.attendanceRate} />
                            </div>
                            <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
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
                                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30'
                                    : 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/30'
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
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Kelas Anda</h3>
                            <span className="bg-indigo-100 text-indigo-700 py-1 px-4 rounded-full text-xs sm:text-sm font-bold shadow-sm">
                                TA {academicYear}
                            </span>
                        </div>

                        {classrooms.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-12 text-center shadow-xl"
                            >
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ClipboardDocumentCheckIcon className="w-8 h-8 text-indigo-300" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-400">Belum ada kelas</h4>
                                <p className="text-gray-400 mt-1 text-sm">Hubungi admin untuk menambahkan kelas.</p>
                            </motion.div>
                        ) : (
                            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                                {classrooms.map((classroom) => {
                                    const isRecorded = classroom.attendance_today.recorded;
                                    const presentPct = classroom.students_count > 0
                                        ? Math.round((classroom.attendance_today.present / classroom.students_count) * 100)
                                        : 0;

                                    return (
                                        <motion.div
                                            variants={item}
                                            key={classroom.id}
                                            className="group relative bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-7 shadow-xl shadow-gray-200/50 hover:bg-white/90 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                                        >
                                            {/* Student count badge */}
                                            <div className="absolute top-6 right-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md shadow-rose-200">
                                                {classroom.students_count} Siswa
                                            </div>

                                            {/* Class icon */}
                                            <div className="h-14 w-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>

                                            <h4 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                                                {classroom.name}
                                            </h4>

                                            {/* Attendance status */}
                                            <div className="mt-3 mb-4">
                                                {isRecorded ? (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
                                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                                                {classroom.attendance_today.present}/{classroom.students_count} Hadir
                                                            </span>
                                                            <span className="text-xs font-bold text-gray-400">{presentPct}%</span>
                                                        </div>
                                                        {/* Mini progress bar */}
                                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full rounded-full bg-emerald-500"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${presentPct}%` }}
                                                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100/80 px-3 py-1.5 rounded-full animate-pulse">
                                                        <ExclamationCircleIcon className="w-3.5 h-3.5" />
                                                        Belum diabsen hari ini
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="mt-auto flex flex-col sm:flex-row gap-2">
                                                <Link
                                                    href={`/classrooms/${classroom.id}/attendance`}
                                                    className="flex-1 bg-gray-900 hover:bg-indigo-600 text-white text-center font-bold py-2.5 px-3 rounded-xl transition-all shadow-md hover:shadow-indigo-500/30 active:scale-95 block text-sm"
                                                >
                                                    Absensi
                                                </Link>
                                                <Link
                                                    href={`/classrooms/${classroom.id}/scores`}
                                                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-center font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95 block text-sm"
                                                >
                                                    Nilai
                                                </Link>
                                                <Link
                                                    href={`/classrooms/${classroom.id}/attendance/report`}
                                                    className="flex-1 bg-white hover:bg-gray-50 text-gray-600 text-center border-2 border-gray-100 hover:border-gray-200 font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95 block text-sm"
                                                >
                                                    Laporan
                                                </Link>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
