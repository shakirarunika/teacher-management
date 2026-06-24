import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function StudentsIndex({ classroom, students }) {
    const [modal, setModal] = useState({ open: false, editing: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const form = useForm({ name: '', gender: 'L', nis: '' });

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
                        <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95">
                            <PlusIcon className="w-4 h-4" /> Tambah Siswa
                        </button>
                    </div>

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
                    <h2 className="text-lg font-bold text-gray-900">{modal.editing ? 'Edit Siswa' : 'Tambah Siswa'}</h2>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Siswa</label>
                            <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} autoFocus
                                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            {form.errors.name && <p className="mt-1 text-sm text-rose-600">{form.errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                            <select value={form.data.gender} onChange={(e) => form.setData('gender', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                            {form.errors.gender && <p className="mt-1 text-sm text-rose-600">{form.errors.gender}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">NIS</label>
                            <input type="text" value={form.data.nis} onChange={(e) => form.setData('nis', e.target.value)}
                                placeholder="Kosongkan untuk dibuat otomatis"
                                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            {form.errors.nis && <p className="mt-1 text-sm text-rose-600">{form.errors.nis}</p>}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50">
                            {modal.editing ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus Siswa */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900">Hapus siswa "{deleteTarget?.name}"?</h2>
                    <p className="mt-2 text-sm text-gray-600">Data nilai & absensi siswa ini akan ikut terhapus permanen.</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 transition">Batal</button>
                        <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-white shadow-md shadow-rose-500/30 transition">Ya, Hapus</button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
