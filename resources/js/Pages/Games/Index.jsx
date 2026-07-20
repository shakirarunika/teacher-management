import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import MathText from '@/Components/MathText';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    PlusIcon, PencilSquareIcon, TrashIcon, PlayIcon, ClockIcon,
    PuzzlePieceIcon, ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

const DIFF_BADGE = {
    mudah: 'bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    sedang: 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    sulit: 'bg-rose-100/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
};

const emptyForm = () => ({ name: '', timer_seconds: 60, question_ids: [] });

export default function GamesIndex({ games, questions, subjects }) {
    const [modal, setModal] = useState({ open: false, editing: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [filter, setFilter] = useState({ subjectId: 'all', difficulty: 'all' });
    const form = useForm(emptyForm());

    const filtered = questions.filter((it) =>
        (filter.subjectId === 'all' || it.subject_id === Number(filter.subjectId)) &&
        (filter.difficulty === 'all' || it.difficulty === filter.difficulty)
    );

    const openCreate = () => { form.clearErrors(); form.setData(emptyForm()); setModal({ open: true, editing: null }); };
    const openEdit = (g) => {
        form.clearErrors();
        form.setData({ name: g.name, timer_seconds: g.timer_seconds, question_ids: g.question_ids });
        setModal({ open: true, editing: g });
    };
    const closeModal = () => setModal({ open: false, editing: null });

    // Urutan centang = urutan soal saat main; bisa digeser dengan tombol ↑↓
    const toggleQuestion = (id) => form.setData('question_ids',
        form.data.question_ids.includes(id)
            ? form.data.question_ids.filter((x) => x !== id)
            : [...form.data.question_ids, id]);
    const moveQuestion = (id, dir) => {
        const ids = [...form.data.question_ids];
        const i = ids.indexOf(id);
        const j = i + dir;
        if (i === -1 || j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        form.setData('question_ids', ids);
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeModal };
        if (modal.editing) form.put(route('games.update', modal.editing.id), opts);
        else form.post(route('games.store'), opts);
    };

    const confirmDelete = () => {
        router.delete(route('games.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    const fmtTimer = (s) => (s % 60 === 0 ? `${s / 60} mnt` : `${s} dtk`);

    return (
        <AuthenticatedLayout>
            <Head title="Game Kelas" />

            <div className="py-2 sm:py-8 relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">Game Kelas</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">
                                Tampilkan soal di proyektor — siswa berebut maju menjawab lewat keyboard
                            </p>
                        </div>
                        <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95">
                            <PlusIcon className="w-4 h-4" /> Buat Game
                        </button>
                    </div>

                    {games.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 p-10 text-center">
                            <PuzzlePieceIcon className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-700" />
                            <p className="mt-3 font-bold text-gray-500 dark:text-slate-400">Belum ada game</p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                                Buat game dari soal isian di bank soal — siapa cepat & benar, soal lanjut!
                            </p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {games.map((g) => (
                                <div key={g.id} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-extrabold text-gray-900 dark:text-slate-100 truncate">{g.name}</h3>
                                            <p className="mt-1 text-xs font-bold text-gray-400 dark:text-slate-500 flex items-center gap-3">
                                                <span>{g.question_ids.length} soal</span>
                                                <span className="inline-flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {g.timer_seconds > 0 ? `${fmtTimer(g.timer_seconds)}/soal` : 'tanpa batas waktu'}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => openEdit(g)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition" title="Edit">
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteTarget(g)} className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition" title="Hapus">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Link token: halaman main tidak membawa sesi login — aman dipegang siswa */}
                                    <a href={route('games.play', g.token)} target="_blank" rel="noopener"
                                        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-extrabold text-sm py-2.5 rounded-xl transition-all active:scale-95">
                                        <PlayIcon className="w-4 h-4" /> Mulai Main
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal buat/edit game */}
            <Modal show={modal.open} onClose={closeModal} maxWidth="2xl">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        {modal.editing ? 'Edit Game' : 'Buat Game Baru'}
                    </h2>

                    <div className="mt-4 grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Nama game</label>
                            <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="Contoh: Extreme Addition Kelas 8A" maxLength={100} required
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            {form.errors.name && <p className="mt-1 text-xs font-bold text-rose-500">{form.errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Waktu per soal (detik)</label>
                            <input type="number" min={5} max={3600} value={form.data.timer_seconds === 0 ? '' : form.data.timer_seconds}
                                required={form.data.timer_seconds !== 0} disabled={form.data.timer_seconds === 0}
                                onChange={(e) => form.setData('timer_seconds', Number(e.target.value))}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50" />
                            <label className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 cursor-pointer">
                                <input type="checkbox" checked={form.data.timer_seconds === 0}
                                    onChange={(e) => form.setData('timer_seconds', e.target.checked ? 0 : 60)}
                                    className="rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800" />
                                Tanpa batas waktu
                            </label>
                            {form.errors.timer_seconds && <p className="mt-1 text-xs font-bold text-rose-500">{form.errors.timer_seconds}</p>}
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">
                                Pilih soal (urutan centang = urutan main) — {form.data.question_ids.length} dipilih
                            </label>
                            <div className="flex gap-2">
                                <select value={filter.subjectId} onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })}
                                    className="rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-xs font-bold py-1.5">
                                    <option value="all">Semua mapel</option>
                                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <select value={filter.difficulty} onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
                                    className="rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-xs font-bold py-1.5">
                                    <option value="all">Semua level</option>
                                    <option value="mudah">Mudah</option>
                                    <option value="sedang">Sedang</option>
                                    <option value="sulit">Sulit</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-800">
                            {filtered.length === 0 && (
                                <div className="p-6 text-center text-sm text-gray-400 dark:text-slate-500 font-semibold">
                                    Belum ada soal <b>isian</b> yang cocok.{' '}
                                    <Link href={route('bank-questions.index')} className="text-indigo-600 dark:text-indigo-400 font-bold inline-flex items-center gap-1">
                                        <ArchiveBoxIcon className="w-4 h-4" /> Tambah di Bank Soal
                                    </Link>
                                </div>
                            )}
                            {filtered.map((it) => {
                                const pos = form.data.question_ids.indexOf(it.id);
                                return (
                                    <label key={it.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/60 transition">
                                        <input type="checkbox" checked={pos !== -1} onChange={() => toggleQuestion(it.id)}
                                            className="mt-0.5 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-800 dark:text-slate-200 line-clamp-2"><MathText text={it.q} /></p>
                                            <p className="mt-0.5 text-[11px] font-bold text-gray-400 dark:text-slate-500 flex items-center gap-2">
                                                <span>{it.subject?.name}</span>
                                                {it.materi && <span>· {it.materi}</span>}
                                                {it.difficulty && <span className={`px-1.5 py-0.5 rounded ${DIFF_BADGE[it.difficulty]}`}>{it.difficulty}</span>}
                                            </p>
                                        </div>
                                        {pos !== -1 && (
                                            <span className="shrink-0 flex items-center gap-1">
                                                <button type="button" onClick={(e) => { e.preventDefault(); moveQuestion(it.id, -1); }} disabled={pos === 0}
                                                    className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-indigo-600 disabled:opacity-30 text-xs font-bold transition">↑</button>
                                                <button type="button" onClick={(e) => { e.preventDefault(); moveQuestion(it.id, 1); }} disabled={pos === form.data.question_ids.length - 1}
                                                    className="w-6 h-6 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-indigo-600 disabled:opacity-30 text-xs font-bold transition">↓</button>
                                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center">{pos + 1}</span>
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                        {form.errors.question_ids && <p className="mt-1 text-xs font-bold text-rose-500">{form.errors.question_ids}</p>}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button type="submit" disabled={form.processing || form.data.question_ids.length === 0}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-semibold text-white shadow-md shadow-indigo-500/30 transition">
                            {modal.editing ? 'Simpan Perubahan' : 'Buat Game'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Konfirmasi hapus */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="sm">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Hapus game?</h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                        <b>{deleteTarget?.name}</b> akan dihapus. Soal di bank soal tidak ikut terhapus.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-white transition">Ya, Hapus</button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
