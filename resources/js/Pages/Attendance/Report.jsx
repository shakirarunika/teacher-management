import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DocumentChartBarIcon, ArrowDownTrayIcon, CalendarDaysIcon,
    ChartPieIcon, TableCellsIcon, ExclamationTriangleIcon,
    CheckCircleIcon, UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

const months = [
    { id: '01', name: 'Januari' }, { id: '02', name: 'Februari' },
    { id: '03', name: 'Maret' },   { id: '04', name: 'April' },
    { id: '05', name: 'Mei' },     { id: '06', name: 'Juni' },
    { id: '07', name: 'Juli' },    { id: '08', name: 'Agustus' },
    { id: '09', name: 'September' },{ id: '10', name: 'Oktober' },
    { id: '11', name: 'November' },{ id: '12', name: 'Desember' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => {
    const y = String(currentYear - 1 + i);
    return { id: y, name: y };
});

// Reusable Listbox dropdown
function FilterDropdown({ value, options, onChange, width = 'w-36' }) {
    return (
        <Listbox value={value} onChange={onChange}>
            <div className={`relative ${width}`}>
                <Listbox.Button className="relative w-full cursor-pointer rounded-2xl bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl py-3 pl-4 pr-10 text-left border border-gray-200 dark:border-slate-800/80 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm transition-all hover:border-indigo-300 dark:hover:border-slate-700">
                    <span className="block truncate font-bold text-gray-700 dark:text-slate-200">
                        {options.find(o => o.id === value)?.name ?? '—'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                    </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-slate-800 py-2 text-sm shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-none ring-1 ring-black/5 dark:ring-white/5 focus:outline-none z-[100]">
                        {options.map((opt) => (
                            <Listbox.Option
                                key={opt.id}
                                value={opt.id}
                                className={({ active }) =>
                                    `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-slate-300'}`
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={`block truncate ${selected ? 'font-black text-indigo-600 dark:text-indigo-400' : 'font-medium'}`}>{opt.name}</span>
                                        {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                                                <CheckIcon className="h-4 w-4" />
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
    );
}

// Status badge in detail table
const STATUS_STYLE = {
    'Hadir': 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    'Sakit': 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    'Izin':  'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    'Alpha': 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    '-':     'text-gray-300 dark:text-slate-700',
};

export default function AttendanceReport({ classroom, filters, summary, detail, recordedDates, holidays }) {
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'detail'

    const handleFilterChange = (field, value) => {
        router.get(route('attendance.report', classroom.id), {
            ...filters,
            [field]: value,
        });
    };

    // CSV helpers
    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportClassSummary = () => {
        let csv = "NIS,Nama Siswa,Hadir,Sakit,Izin,Alpha\n";
        summary.forEach(r => { csv += `${r.nis},"${r.name}",${r.hadir},${r.sakit},${r.izin},${r.alpha}\n`; });
        downloadCSV(csv, `Rekap_${classroom.name}_${filters.year}_${filters.month}.csv`);
    };

    const exportStudentDetail = () => {
        let csv = "NIS,Nama Siswa," + recordedDates.join(",") + "\n";
        detail.forEach(s => {
            let row = `${s.nis},"${s.name}"`;
            recordedDates.forEach(d => { row += `,${s.logs[d] || '-'}`; });
            csv += row + "\n";
        });
        downloadCSV(csv, `Detail_Harian_${classroom.name}_${filters.year}_${filters.month}.csv`);
    };

    // Aggregate stats
    const totalStudents = summary.length;
    const totalRecorded = recordedDates.length;
    const totalHadir   = summary.reduce((s, r) => s + r.hadir, 0);
    const totalSakit   = summary.reduce((s, r) => s + r.sakit, 0);
    const totalIzin    = summary.reduce((s, r) => s + r.izin, 0);
    const totalAlpha   = summary.reduce((s, r) => s + r.alpha, 0);
    const totalAbsences = totalHadir + totalSakit + totalIzin + totalAlpha;
    const attendanceRate = totalAbsences > 0 ? Math.round((totalHadir / totalAbsences) * 100) : 0;
    const atRiskStudents = summary.filter(r => r.alpha >= 3);

    const monthLabel = months.find(m => m.id === filters.month)?.name ?? '';

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Laporan ${classroom.name} - SINTESIS`} />

            <div className="py-6 sm:py-8 relative z-10 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-12">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-indigo-100/50 dark:shadow-none relative z-50 transition-colors duration-300"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
                                    <DocumentChartBarIcon className="w-6 h-6" />
                                    <span className="font-bold uppercase tracking-wider text-sm">Laporan Absensi</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{classroom.name}</h2>
                                <p className="text-gray-500 dark:text-slate-400 font-medium mt-1">
                                    {monthLabel} {filters.year} — {totalRecorded} hari tercatat
                                </p>
                            </div>

                            {/* Filters + Export */}
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                <div className="flex gap-2">
                                    <FilterDropdown
                                        value={filters.month}
                                        options={months}
                                        onChange={val => handleFilterChange('month', val)}
                                        width="w-36"
                                    />
                                    <FilterDropdown
                                        value={filters.year}
                                        options={years}
                                        onChange={val => handleFilterChange('year', val)}
                                        width="w-28"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <motion.button
                                        type="button"
                                        onClick={exportClassSummary}
                                        whileTap={{ scale: 0.96 }}
                                        whileHover={{ scale: 1.02 }}
                                        disabled={summary.length === 0}
                                        className="bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 disabled:opacity-40 text-indigo-700 dark:text-indigo-350 px-4 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm border border-indigo-100/30 dark:border-indigo-900/30"
                                    >
                                        <ChartPieIcon className="w-4 h-4" />
                                        Ekspor Rekap
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        onClick={exportStudentDetail}
                                        whileTap={{ scale: 0.96 }}
                                        whileHover={{ scale: 1.02 }}
                                        disabled={detail.length === 0 || recordedDates.length === 0}
                                        className="bg-gray-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg dark:shadow-none"
                                    >
                                        <TableCellsIcon className="w-4 h-4" />
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                        Ekspor Detail
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stat Cards */}
                    {summary.length > 0 && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                        >
                            {[
                                { label: 'Hadir', value: totalHadir, color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-200' },
                                { label: 'Sakit', value: totalSakit, color: 'from-amber-400 to-amber-500', shadow: 'shadow-amber-200' },
                                { label: 'Izin',  value: totalIzin,  color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-200' },
                                { label: 'Alpha', value: totalAlpha, color: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-200' },
                            ].map(stat => (
                                <motion.div
                                    key={stat.label}
                                    variants={itemVariants}
                                    className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-lg ${stat.shadow} dark:shadow-none`}
                                >
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-4xl font-black mt-1">{stat.value}</p>
                                    <p className="text-white/60 text-xs mt-1">
                                        {totalAbsences > 0 ? Math.round((stat.value / totalAbsences) * 100) : 0}% dari total
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Attendance rate bar + at-risk alert */}
                    {summary.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-6 shadow-xl shadow-indigo-100/50 dark:shadow-none space-y-4 transition-colors duration-300"
                        >
                            {/* Rate bar */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-gray-600 dark:text-slate-350">Tingkat Kehadiran Kelas</span>
                                    <span className={`text-sm font-black ${attendanceRate >= 80 ? 'text-emerald-600 dark:text-emerald-450' : attendanceRate >= 60 ? 'text-amber-600 dark:text-amber-450' : 'text-rose-600 dark:text-rose-450'}`}>
                                        {attendanceRate}%
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${attendanceRate >= 80 ? 'bg-emerald-500' : attendanceRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${attendanceRate}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                    />
                                </div>
                            </div>

                            {/* At-risk students */}
                            {atRiskStudents.length > 0 && (
                                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                                        <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                                            {atRiskStudents.length} Siswa Perlu Perhatian (Alpha ≥ 3)
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {atRiskStudents.map(s => (
                                            <span key={s.id} className="inline-flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                                {s.name}
                                                <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-black">{s.alpha}x</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {[
                            { id: 'summary', label: 'Rekap Bulanan', icon: ChartPieIcon },
                            { id: 'detail',  label: 'Detail Harian', icon: TableCellsIcon },
                        ].map(tab => (
                            <motion.button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                whileTap={{ scale: 0.97 }}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : 'bg-white/70 dark:bg-slate-900/45 text-gray-600 dark:text-slate-350 border border-white dark:border-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-900/60'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'summary' ? (
                            /* ─── Summary Table ─── */
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] shadow-xl dark:shadow-none overflow-hidden transition-colors duration-300"
                            >
                                {summary.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <CalendarDaysIcon className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-gray-400 dark:text-slate-500">Belum Ada Data Absensi</h3>
                                        <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Tidak ada absensi yang tercatat untuk {monthLabel} {filters.year}.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/70 dark:bg-slate-950/40 border-b border-gray-100 dark:border-slate-850">
                                                    <th className="py-4 px-6 font-black text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wider">No</th>
                                                    <th className="py-4 px-6 font-black text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Nama Siswa</th>
                                                    <th className="py-4 px-6 font-black text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider text-center">Hadir</th>
                                                    <th className="py-4 px-6 font-black text-amber-500 dark:text-amber-400 text-xs uppercase tracking-wider text-center">Sakit</th>
                                                    <th className="py-4 px-6 font-black text-blue-500 dark:text-blue-400 text-xs uppercase tracking-wider text-center">Izin</th>
                                                    <th className="py-4 px-6 font-black text-rose-500 dark:text-rose-455 text-xs uppercase tracking-wider text-center">Alpha</th>
                                                    <th className="py-4 px-6 font-black text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wider text-center">% Hadir</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summary.map((row, idx) => {
                                                    const total = row.hadir + row.sakit + row.izin + row.alpha;
                                                    const pct = total > 0 ? Math.round((row.hadir / total) * 100) : 0;
                                                    const isRisk = row.alpha >= 3;
                                                    return (
                                                        <motion.tr
                                                            key={row.id}
                                                            variants={itemVariants}
                                                            initial="hidden"
                                                            animate="show"
                                                            className={`border-b border-gray-50 dark:border-slate-850/50 transition-colors ${isRisk ? 'bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/60 dark:hover:bg-rose-950/20' : 'hover:bg-white/60 dark:hover:bg-slate-900/30'}`}
                                                        >
                                                            <td className="py-4 px-6 text-gray-400 dark:text-slate-500 font-bold text-sm">{idx + 1}</td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-bold text-gray-900 dark:text-slate-200">{row.name}</div>
                                                                    {isRisk && <ExclamationTriangleIcon className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                                                                </div>
                                                                <div className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-0.5">NIS: {row.nis}</div>
                                                            </td>
                                                            <td className="py-4 px-6 text-center font-black text-emerald-600 dark:text-emerald-400 text-lg">{row.hadir}</td>
                                                            <td className="py-4 px-6 text-center font-black text-amber-500 dark:text-amber-400 text-lg">{row.sakit}</td>
                                                            <td className="py-4 px-6 text-center font-black text-blue-500 dark:text-blue-400 text-lg">{row.izin}</td>
                                                            <td className={`py-4 px-6 text-center font-black text-lg ${isRisk ? 'text-rose-600 dark:text-rose-450' : 'text-rose-400 dark:text-rose-350'}`}>{row.alpha}</td>
                                                            <td className="py-4 px-6 text-center">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className={`text-sm font-black ${pct >= 80 ? 'text-emerald-600 dark:text-emerald-450' : pct >= 60 ? 'text-amber-600 dark:text-amber-450' : 'text-rose-600 dark:text-rose-455'}`}>
                                                                        {pct}%
                                                                    </span>
                                                                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                            style={{ width: `${pct}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            /* ─── Detail Harian Table ─── */
                            <motion.div
                                key="detail"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] shadow-xl dark:shadow-none overflow-hidden transition-colors duration-300"
                            >
                                {recordedDates.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <CalendarDaysIcon className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-gray-400 dark:text-slate-500">Belum Ada Data Harian</h3>
                                        <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Tidak ada absensi yang tercatat untuk {monthLabel} {filters.year}.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-max">
                                            <thead>
                                                <tr className="bg-gray-50/70 dark:bg-slate-950/40 border-b border-gray-100 dark:border-slate-850">
                                                    <th className="py-4 px-4 font-black text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider sticky left-0 bg-gray-50/90 dark:bg-slate-950/70 backdrop-blur-md z-10 min-w-[180px]">
                                                        Nama Siswa
                                                    </th>
                                                    {recordedDates.map(date => {
                                                        const holiday = holidays?.[date];
                                                        return (
                                                            <th
                                                                key={date}
                                                                title={holiday ? `${holiday.name} (${holiday.type})` : undefined}
                                                                className={`py-4 px-2 font-black text-xs text-center min-w-[56px] ${
                                                                    holiday
                                                                        ? holiday.type === 'Nasional'
                                                                            ? 'text-rose-600 dark:text-rose-450 bg-rose-50/30 dark:bg-rose-950/20'
                                                                            : 'text-amber-600 dark:text-amber-450 bg-amber-50/30 dark:bg-amber-950/20'
                                                                        : 'text-gray-400 dark:text-slate-500'
                                                                }`}
                                                            >
                                                                <div>{new Date(date).getDate()}</div>
                                                                <div className={`text-[10px] font-semibold capitalize ${holiday ? 'opacity-95' : 'text-gray-300 dark:text-slate-600'}`}>
                                                                    {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detail.map((student, idx) => (
                                                    <motion.tr
                                                        key={student.nis}
                                                        variants={itemVariants}
                                                        initial="hidden"
                                                        animate="show"
                                                        className="border-b border-gray-50 dark:border-slate-850/50 hover:bg-white/60 dark:hover:bg-slate-900/30 transition-colors"
                                                    >
                                                        <td className="py-3 px-4 sticky left-0 bg-white/80 dark:bg-slate-950/70 backdrop-blur-sm z-10">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black flex-shrink-0">
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900 dark:text-slate-200 text-sm leading-tight">{student.name}</div>
                                                                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{student.nis}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {recordedDates.map(date => {
                                                            const status = student.logs[date] || '-';
                                                            const holiday = holidays?.[date];
                                                            
                                                            let displayChar = '·';
                                                            let customStyle = 'text-gray-300 dark:text-slate-700';

                                                            if (status !== '-') {
                                                                const abbrev = { 'Hadir': 'H', 'Sakit': 'S', 'Izin': 'I', 'Alpha': 'A' };
                                                                displayChar = abbrev[status] ?? '·';
                                                                customStyle = STATUS_STYLE[status] ?? 'text-gray-300 dark:text-slate-750';
                                                            } else if (holiday) {
                                                                displayChar = 'L';
                                                                customStyle = holiday.type === 'Nasional'
                                                                    ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 font-bold border border-rose-200 dark:border-rose-900/30'
                                                                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-350 font-bold border border-amber-200 dark:border-amber-900/30';
                                                            }

                                                            return (
                                                                <td
                                                                    key={date}
                                                                    className={`py-3 px-2 text-center ${holiday ? 'bg-gray-50/20 dark:bg-slate-950/10' : ''}`}
                                                                    title={holiday ? `${holiday.name} (${holiday.type})` : undefined}
                                                                >
                                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${customStyle}`}>
                                                                        {displayChar}
                                                                    </span>
                                                                </td>
                                                            );
                                                        })}
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Legend */}
                                        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-850 bg-gray-50/30 dark:bg-slate-950/20">
                                            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Keterangan:</span>
                                            {[
                                                { label: 'H — Hadir',  cls: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
                                                { label: 'S — Sakit',  cls: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
                                                { label: 'I — Izin',   cls: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
                                                { label: 'A — Alpha',  cls: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350' },
                                                { label: 'L — Libur',  cls: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-350 border border-rose-200 dark:border-rose-900/30' },
                                                { label: '· — Tidak dicatat', cls: 'text-gray-300 dark:text-slate-600' },
                                            ].map(l => (
                                                <span key={l.label} className={`text-xs font-bold px-2 py-1 rounded-lg ${l.cls}`}>{l.label}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
