import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowLeftIcon, UserGroupIcon, ArrowUpTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function StudentsIndex({ classroom, students }) {
    const { flash } = usePage().props;
    const [modal, setModal] = useState({ open: false, editing: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showImport, setShowImport] = useState(false);
    const form = useForm({ name: '', gender: 'L', nis: '' });
    const importForm = useForm({ file: null });

    const submitImport = (e) => {
        e.preventDefault();
        importForm.post(route('students.import', classroom.id), {
            preserveScroll: true,
            onSuccess: () => { setShowImport(false); importForm.reset(); },
        });
    };

    const openCreate = () => { form.clearErrors(); form.setData({ name: '', gender: 'L', nis: '' }); setModal({ open: true, editing: null }); };
    const openEdit = (s) => { form.clearErrors(); form.setData({ name: s.name, gender: s.gender, nis: s.nis }); setModal({ open: true, editing: s }); };
    const closeModal = () => setModal({ open: false, editing: null });

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeModal };
        if (modal.editing) {
            form.put(route('students.update', [classroom.id, modal.editing.id]), opts);
        } else {
            form.post(route('students.store', classroom.id), opts);
        }
    };

    const confirmDelete = () => {
        router.delete(route('students.destroy', [classroom.id, deleteTarget.id]), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Siswa - ${classroom.name}`} />

            <div className="py-2 sm:py-8 relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Link href={route('dashboard')} className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/45 border border-white dark:border-slate-800/80 text-gray-600 dark:text-slate-300 hover:bg-white transition active:scale-95">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">{classroom.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">{students.length} siswa</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-slate-900/45 border border-gray-200 dark:border-slate-800/80 hover:bg-white text-gray-700 dark:text-slate-200 font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95">
                                <ArrowUpTrayIcon className="w-4 h-4" /> Import Excel
                            </button>
                            <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95">
                                <PlusIcon className="w-4 h-4" /> Tambah Siswa
                            </button>
                        </div>
                    </div>

                    {/* Flash hasil import / aksi */}
                    {flash?.success && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4">
                            <p className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                                <CheckCircleIcon className="w-5 h-5 shrink-0" /> {flash.success}
                            </p>
                            {flash.import_skipped?.length > 0 && (
                                <ul className="mt-2 ml-7 text-xs text-emerald-800/80 dark:text-emerald-400/80 list-disc space-y-0.5">
                                    {flash.import_skipped.map((msg, i) => <li key={i}>{msg}</li>)}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* List */}
                    {students.length === 0 ? (
                        <div className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-xl dark:shadow-none">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <UserGroupIcon className="w-8 h-8 text-indigo-300 dark:text-indigo-400" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-400 dark:text-slate-400">Belum ada siswa</h4>
                            <p className="text-gray-400 dark:text-slate-500 mt-1 text-sm">Tambahkan siswa pertama ke kelas ini.</p>
                        </div>
                    ) : (
                        <div className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] shadow-xl dark:shadow-none overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 dark:bg-slate-800/50 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 font-bold">
                                    <tr>
                                        <th className="px-6 py-4">NIS</th>
                                        <th className="px-6 py-4">Nama</th>
                                        <th className="px-6 py-4">L/P</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {students.map((s) => (
                                        <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                                            <td className="px-6 py-3.5 font-mono text-sm text-gray-500 dark:text-slate-400">{s.nis}</td>
                                            <td className="px-6 py-3.5 font-semibold text-gray-800 dark:text-slate-200">{s.name}</td>
                                            <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-slate-300">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(s)} title="Edit" className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition active:scale-95">
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(s)} title="Hapus" className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition active:scale-95">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah/Edit Siswa */}
            <Modal show={modal.open} onClose={closeModal} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{modal.editing ? 'Edit Siswa' : 'Tambah Siswa'}</h2>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nama Siswa</label>
                            <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} autoFocus
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            {form.errors.name && <p className="mt-1 text-sm text-rose-600">{form.errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Jenis Kelamin</label>
                            <select value={form.data.gender} onChange={(e) => form.setData('gender', e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                            {form.errors.gender && <p className="mt-1 text-sm text-rose-600">{form.errors.gender}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">NIS</label>
                            <input type="text" value={form.data.nis} onChange={(e) => form.setData('nis', e.target.value)}
                                placeholder="Kosongkan untuk dibuat otomatis"
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            {form.errors.nis && <p className="mt-1 text-sm text-rose-600">{form.errors.nis}</p>}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50">
                            {modal.editing ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Import Excel/CSV */}
            <Modal show={showImport} onClose={() => setShowImport(false)} maxWidth="md">
                <form onSubmit={submitImport} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Import Siswa dari Excel/CSV</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        Siswa akan langsung masuk ke kelas <span className="font-semibold">{classroom.name}</span>.
                    </p>

                    <div className="mt-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 p-4 text-sm">
                        <p className="font-semibold text-gray-700 dark:text-slate-300 mb-2">Format: 3 kolom, tanpa perlu judul kolom</p>
                        <table className="w-full text-xs border-collapse">
                            <tbody className="text-gray-600 dark:text-slate-400">
                                <tr className="border-b border-gray-200 dark:border-slate-700">
                                    <td className="py-1 pr-3 font-mono">Budi Santoso</td>
                                    <td className="py-1 pr-3 font-mono">L</td>
                                    <td className="py-1 font-mono text-gray-400">20260012</td>
                                </tr>
                                <tr>
                                    <td className="py-1 pr-3 font-mono">Siti Aminah</td>
                                    <td className="py-1 pr-3 font-mono">P</td>
                                    <td className="py-1 font-mono text-gray-400 italic">(kosong = otomatis)</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">Kolom: Nama, L/P, NIS (opsional). Maksimal 500 baris.</p>
                    </div>

                    <div className="mt-4">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => importForm.setData('file', e.target.files[0])}
                            className="block w-full text-sm text-gray-600 dark:text-slate-300 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 dark:file:bg-indigo-950/40 file:text-indigo-700 dark:file:text-indigo-300 file:font-bold file:text-sm hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer"
                        />
                        {importForm.errors.file && <p className="mt-2 text-sm text-rose-600">{importForm.errors.file}</p>}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button type="submit" disabled={importForm.processing || !importForm.data.file} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50">
                            {importForm.processing ? 'Mengimpor...' : 'Import'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus Siswa */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Hapus siswa "{deleteTarget?.name}"?</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Data nilai & absensi siswa ini akan ikut terhapus permanen.</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-white shadow-md shadow-rose-500/30 transition">Ya, Hapus</button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
