import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDaysIcon, PlusIcon, TrashIcon,
    ExclamationTriangleIcon, CalendarIcon, SparklesIcon,
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

function FilterDropdown({ value, options, onChange, width = 'w-36' }) {
    return (
        <Listbox value={value} onChange={onChange}>
            <div className={`relative ${width}`}>
                <Listbox.Button className="relative w-full cursor-pointer rounded-2xl bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl py-3 pl-4 pr-10 text-left border border-gray-200 dark:border-slate-800/80 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-750">
                    <span className="block truncate font-bold text-gray-700 dark:text-slate-200">
                        {options.find(o => o.id === value)?.name ?? '—'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                    </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-2 text-sm border border-white/20 dark:border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-[100]">
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

export default function HolidaysIndex({ holidays, filters }) {

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, holiday: null });
    const [syncing, setSyncing] = useState(false);

    const handleFilterChange = (field, value) => {
        router.get(route('holidays.index'), {
            ...filters,
            [field]: value,
        });
    };

    const syncNationalHolidays = () => {
        setSyncing(true);
        router.post(route('holidays.sync'), {
            year: filters.year
        }, {
            onFinish: () => setSyncing(false)
        });
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        date: '',
        name: '',
        type: 'Nasional',
    });

    const submitForm = (e) => {
        e.preventDefault();
        post(route('holidays.store'), {
            onSuccess: () => reset(),
        });
    };

    const confirmDelete = (holiday) => {
        setDeleteModal({ isOpen: true, holiday });
    };

    const handleDelete = () => {
        if (!deleteModal.holiday) return;
        router.delete(route('holidays.destroy', deleteModal.holiday.id), {
            onSuccess: () => setDeleteModal({ isOpen: false, holiday: null }),
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    };

    const monthLabel = months.find(m => m.id === filters.month)?.name ?? '';

    return (
        <AuthenticatedLayout>
            <Head title="Hari Libur" />

            <div className="py-6 sm:py-8 relative z-10 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-indigo-100/50 dark:shadow-none relative z-50 transition-colors duration-300"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
                                    <CalendarDaysIcon className="w-6 h-6" />
                                    <span className="font-bold uppercase tracking-wider text-sm">Kalender Sekolah</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Manajemen Hari Libur</h2>
                                <p className="text-gray-500 dark:text-slate-400 font-medium mt-1">
                                    Atur Libur Nasional & Libur Internal Sekolah
                                </p>
                            </div>

                            {/* Monthly filters + Sync Button */}
                            <div className="flex flex-wrap items-center gap-3">
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
                                <motion.button
                                    type="button"
                                    onClick={syncNationalHolidays}
                                    disabled={syncing}
                                    whileTap={{ scale: 0.96 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-50 text-indigo-700 dark:text-indigo-300 font-bold py-3 px-4 rounded-2xl text-sm transition-all border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2 shadow-sm"
                                >
                                    <SparklesIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                    {syncing ? 'Memproses...' : `Sync Libur ${filters.year}`}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Form Card (1/3 width) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-6 shadow-xl shadow-gray-100/50 dark:shadow-none h-fit transition-colors duration-300"
                        >
                                <h3 className="text-lg font-black text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <PlusIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Tambah Hari Libur
                                </h3>

                                <form onSubmit={submitForm} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Tanggal</label>
                                        <input
                                            type="date"
                                            value={data.date}
                                            onChange={e => setData('date', e.target.value)}
                                            className="w-full rounded-xl border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 border-2 py-3 px-4 text-sm font-bold text-gray-700 dark:text-slate-200 focus:border-indigo-500 dark:focus:border-indigo-700 focus:ring-0 transition-colors"
                                            required
                                        />
                                        {errors.date && (
                                            <p className="text-xs text-rose-500 font-bold mt-1">{errors.date}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Nama Hari Libur</label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Hari Raya Nyepi, Libur Semester"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full rounded-xl border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 border-2 py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:border-indigo-500 dark:focus:border-indigo-700 focus:ring-0 transition-colors"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-rose-500 font-bold mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Tipe Libur</label>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'Nasional', label: 'Nasional', color: 'border-rose-100 hover:bg-rose-50/50 checked:bg-rose-600 active:bg-rose-500 text-rose-600' },
                                                { id: 'Internal', label: 'Internal Sekolah', color: 'border-amber-100 hover:bg-amber-50/50 checked:bg-amber-600 active:bg-amber-500 text-amber-600' },
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setData('type', t.id)}
                                                    className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                                                        data.type === t.id
                                                            ? t.id === 'Nasional'
                                                                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 dark:border-rose-700 text-rose-700 dark:text-rose-450'
                                                                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 dark:border-amber-700 text-amber-700 dark:text-amber-450'
                                                            : 'bg-white/40 dark:bg-slate-900/40 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.type && (
                                            <p className="text-xs text-rose-500 font-bold mt-1">{errors.type}</p>
                                        )}
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={processing}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-100/50 dark:shadow-none flex items-center justify-center gap-2 mt-6"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                        Simpan Libur
                                    </motion.button>
                                </form>
                        </motion.div>

                        {/* List/Calendar View (2/3 width) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2 bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-6 shadow-xl shadow-gray-100/50 dark:shadow-none min-h-[300px] transition-colors duration-300"
                        >
                            <h3 className="text-lg font-black text-gray-900 dark:text-slate-100 mb-4">
                                Hari Libur Terdaftar — {monthLabel} {filters.year}
                            </h3>

                            {holidays.length === 0 ? (
                                <div className="py-16 text-center">
                                    <CalendarDaysIcon className="w-12 h-12 text-gray-200 dark:text-slate-800 mx-auto mb-4" />
                                    <h4 className="text-md font-bold text-gray-400 dark:text-slate-500">Tidak Ada Hari Libur Bulan Ini</h4>
                                    <p className="text-gray-400 dark:text-slate-550 text-xs mt-1">
                                        Silakan tambah hari libur melalui panel sebelah kiri.
                                    </p>
                                </div>
                            ) : (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="space-y-3"
                                >
                                    {holidays.map(h => {
                                        const formattedDate = new Date(h.date).toLocaleDateString('id-ID', {
                                            weekday: 'long', day: 'numeric', month: 'long',
                                        });
                                        const isNational = h.type === 'Nasional';
                                        return (
                                            <motion.div
                                                key={h.id}
                                                variants={itemVariants}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                    isNational
                                                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 hover:bg-rose-50/60 dark:hover:bg-rose-950/30'
                                                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 hover:bg-amber-50/60 dark:hover:bg-amber-950/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${
                                                        isNational ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                                                    }`}>
                                                        {new Date(h.date).getDate()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
                                                            {h.name}
                                                        </div>
                                                        <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 mt-0.5">
                                                            {formattedDate}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                                        isNational ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-750 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-755 dark:text-amber-300'
                                                    }`}>
                                                        {h.type}
                                                    </span>

                                                    <motion.button
                                                        type="button"
                                                        onClick={() => confirmDelete(h)}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="w-8 h-8 rounded-lg text-gray-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </motion.div>

                    </div>

                </div>
            </div>

            {/* Confirm Delete Modal */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-[200] overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4 text-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-gray-900/50 dark:bg-slate-950/60 backdrop-blur-sm"
                                onClick={() => setDeleteModal({ isOpen: false, holiday: null })}
                            />

                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-8 text-left shadow-2xl transition-all border border-white/45 dark:border-slate-800/85"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450">
                                        <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 leading-6">
                                            Hapus Hari Libur?
                                        </h3>
                                        <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-slate-400">
                                            Apakah Anda yakin ingin menghapus hari libur <span className="text-gray-800 dark:text-slate-200 font-bold">"{deleteModal.holiday?.name}"</span>? Tanggal tersebut akan kembali seperti hari biasa.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteModal({ isOpen: false, holiday: null })}
                                        className="w-full sm:w-auto bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-rose-200 dark:shadow-none"
                                    >
                                        Ya, Hapus
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </AuthenticatedLayout>
    );
}
