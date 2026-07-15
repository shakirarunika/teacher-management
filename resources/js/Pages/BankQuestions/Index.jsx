import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import MathText, { hasMath } from '@/Components/MathText';
import QuestionExtras from '@/Components/QuestionMedia';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { lazy, Suspense, useState } from 'react';

// MathLive berat (~220kB gzip) — muat hanya saat editor rumus dibuka
const MathModal = lazy(() => import('@/Components/MathModal'));
import {
    PlusIcon, PencilSquareIcon, TrashIcon, CheckCircleIcon,
    XMarkIcon, ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

const emptyForm = (subjects) => ({
    subject_id: subjects[0]?.id ?? '', materi: '', difficulty: '',
    q: '', stimulus: '', media: null, options: ['', ''], answer: 0,
});

const DIFF_BADGE = {
    mudah: 'bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    sedang: 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    sulit: 'bg-rose-100/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400',
};

export default function BankQuestionsIndex({ questions, subjects }) {
    const { flash } = usePage().props;
    const [modal, setModal] = useState({ open: false, editing: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [filter, setFilter] = useState({ subjectId: 'all', difficulty: 'all' });
    const form = useForm(emptyForm(subjects));

    const filtered = questions.filter((it) =>
        (filter.subjectId === 'all' || it.subject_id === Number(filter.subjectId)) &&
        (filter.difficulty === 'all' || it.difficulty === filter.difficulty)
    );

    const openCreate = () => { form.clearErrors(); form.setData(emptyForm(subjects)); setModal({ open: true, editing: null }); };
    const openEdit = (it) => {
        form.clearErrors();
        form.setData({ subject_id: it.subject_id, materi: it.materi ?? '', difficulty: it.difficulty ?? '', q: it.q, stimulus: it.stimulus ?? '', media: it.media ?? null, options: it.options, answer: it.answer });
        setModal({ open: true, editing: it });
    };
    const closeModal = () => setModal({ open: false, editing: null });

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeModal };
        form.transform((data) => ({ ...data, materi: data.materi || null, difficulty: data.difficulty || null }));
        if (modal.editing) form.put(route('bank-questions.update', modal.editing.id), opts);
        else form.post(route('bank-questions.store'), opts);
    };

    const setOption = (j, value) => {
        const options = [...form.data.options];
        options[j] = value;
        form.setData('options', options);
    };
    const removeOption = (j) => {
        form.setData({
            ...form.data,
            options: form.data.options.filter((_, k) => k !== j),
            answer: form.data.answer === j ? 0 : form.data.answer > j ? form.data.answer - 1 : form.data.answer,
        });
    };

    // Editor rumus: target 'q' (pertanyaan) atau index opsi
    const [mathTarget, setMathTarget] = useState(null);
    // ponytail: rumus disisip di akhir teks; lacak posisi kursor kalau guru komplain
    const insertMath = (latex) => {
        const glue = (s) => (s.trim() ? `${s.trimEnd()} ${latex}` : latex);
        if (mathTarget === 'q') form.setData('q', glue(form.data.q));
        else setOption(mathTarget, glue(form.data.options[mathTarget]));
    };

    const confirmDelete = () => {
        router.delete(route('bank-questions.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Bank Soal" />

            <div className="py-2 sm:py-8 relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">Bank Soal</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">{questions.length} soal tersimpan · bisa dipakai ulang di semua kuis</p>
                        </div>
                        <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95">
                            <PlusIcon className="w-4 h-4" /> Tambah Soal
                        </button>
                    </div>

                    {flash?.success && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4">
                            <p className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                                <CheckCircleIcon className="w-5 h-5 shrink-0" /> {flash.success}
                            </p>
                        </div>
                    )}

                    {/* Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <select value={filter.subjectId} onChange={(e) => setFilter((f) => ({ ...f, subjectId: e.target.value }))}
                            className="rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="all">Semua mapel</option>
                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select value={filter.difficulty} onChange={(e) => setFilter((f) => ({ ...f, difficulty: e.target.value }))}
                            className="rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="all">Semua tingkat</option>
                            <option value="mudah">Mudah</option>
                            <option value="sedang">Sedang</option>
                            <option value="sulit">Sulit</option>
                        </select>
                    </div>

                    {/* List */}
                    {filtered.length === 0 ? (
                        <div className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-xl dark:shadow-none">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ArchiveBoxIcon className="w-8 h-8 text-indigo-300 dark:text-indigo-400" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-400 dark:text-slate-400">Belum ada soal</h4>
                            <p className="text-gray-400 dark:text-slate-500 mt-1 text-sm">Soal yang disimpan di sini bisa dipakai ulang di kuis mana pun lewat tombol "Ambil dari Bank Soal".</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((it) => (
                                <motion.div key={it.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-2xl p-4 shadow-xl dark:shadow-none flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-slate-200"><MathText text={it.q} /></p>
                                        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                                            <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/45 px-2.5 py-0.5 rounded-full">{it.subject?.name}</span>
                                            {it.materi && <span className="font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">{it.materi}</span>}
                                            {it.difficulty && <span className={`font-bold px-2.5 py-0.5 rounded-full ${DIFF_BADGE[it.difficulty]}`}>{it.difficulty}</span>}
                                            <span className="text-gray-400 dark:text-slate-500">
                                                Kunci: {String.fromCharCode(65 + it.answer)}. <MathText text={it.options[it.answer]} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => openEdit(it)} title="Edit" className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition active:scale-95">
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteTarget(it)} title="Hapus" className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition active:scale-95">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah/Edit Soal — klik backdrop dikonfirmasi dulu biar ketikan tidak hilang */}
            <Modal show={modal.open} onClose={() => { if (window.confirm('Tutup form? Perubahan yang belum disimpan akan hilang.')) closeModal(); }} maxWidth="xl">
                <form onSubmit={submit} className="p-6 max-h-[85vh] overflow-y-auto">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{modal.editing ? 'Edit Soal' : 'Tambah Soal ke Bank'}</h2>

                    <div className="mt-4 grid sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Mata Pelajaran</label>
                            <select value={form.data.subject_id} onChange={(e) => form.setData('subject_id', e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {form.errors.subject_id && <p className="mt-1 text-sm text-rose-600">{form.errors.subject_id}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Bab/Materi <span className="text-gray-400">(opsional)</span></label>
                            <input type="text" value={form.data.materi} onChange={(e) => form.setData('materi', e.target.value)}
                                placeholder="Mis. Pecahan"
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Tingkat <span className="text-gray-400">(opsional)</span></label>
                            <select value={form.data.difficulty} onChange={(e) => form.setData('difficulty', e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                <option value="">-</option>
                                <option value="mudah">Mudah</option>
                                <option value="sedang">Sedang</option>
                                <option value="sulit">Sulit</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Pertanyaan</label>
                        <div className="mt-1 flex items-start gap-2">
                            <textarea value={form.data.q} onChange={(e) => form.setData('q', e.target.value)} rows={2} autoFocus
                                className="block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                            <button type="button" onClick={() => setMathTarget('q')} title="Sisipkan rumus matematika"
                                className="shrink-0 px-3 py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-sm transition">Σ</button>
                        </div>
                        <QuestionExtras q={form.data} onChange={(patch) => form.setData({ ...form.data, ...patch })} />
                        {form.errors.q && <p className="mt-1 text-sm text-rose-600">{form.errors.q}</p>}
                    </div>

                    <div className="mt-4 space-y-2">
                        {form.data.options.map((opt, j) => (
                            <div key={j} className="flex items-center gap-2">
                                <input type="radio" name="bank-answer" checked={form.data.answer === j} onChange={() => form.setData('answer', j)}
                                    title="Tandai sebagai kunci jawaban"
                                    className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-slate-600 focus:ring-emerald-500" />
                                <input type="text" value={opt} onChange={(e) => setOption(j, e.target.value)}
                                    placeholder={`Pilihan ${String.fromCharCode(65 + j)}`}
                                    className={`flex-1 rounded-lg px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${form.data.answer === j ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-gray-300 dark:border-slate-700'}`} />
                                <button type="button" onClick={() => setMathTarget(j)} title="Sisipkan rumus matematika"
                                    className="shrink-0 px-2.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition">Σ</button>
                                {form.data.options.length > 2 && (
                                    <button type="button" onClick={() => removeOption(j)} className="p-1 rounded-md text-gray-400 hover:text-rose-500 transition">
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {form.errors.options && <p className="text-sm text-rose-600">{form.errors.options}</p>}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        {form.data.options.length < 5 ? (
                            <button type="button" onClick={() => form.setData('options', [...form.data.options, ''])}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                + Tambah pilihan
                            </button>
                        ) : <span />}
                        <span className="text-xs text-gray-400 dark:text-slate-500">Klik bulatan = kunci jawaban</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                        💡 Rumus matematika: klik tombol <span className="font-bold text-indigo-500">Σ</span> untuk membuka editor rumus, atau ketik manual di antara tanda dolar mis. <code className="font-mono">{'$\\frac{1}{2}x^2$'}</code>
                    </p>

                    {/* Preview rumus (muncul kalau ada $...$) */}
                    {hasMath(form.data.q, form.data.options) && (
                        <div className="mt-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-900 p-3">
                            <p className="text-[10px] font-black uppercase tracking-wide text-indigo-400 mb-1.5">Preview tampilan siswa</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200"><MathText text={form.data.q} /></p>
                            <ul className="mt-1.5 space-y-0.5">
                                {form.data.options.map((opt, j) => (
                                    <li key={j} className="text-sm text-gray-600 dark:text-slate-400">
                                        {String.fromCharCode(65 + j)}. <MathText text={opt} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50">
                            {modal.editing ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Hapus soal ini dari bank?</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Kuis yang sudah memakai soal ini tidak terpengaruh (soalnya sudah tersalin ke kuis).</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-white shadow-md shadow-rose-500/30 transition">Ya, Hapus</button>
                    </div>
                </div>
            </Modal>

            {/* Editor rumus matematika (MathLive) */}
            <Suspense fallback={null}>
                {mathTarget !== null && <MathModal show onClose={() => setMathTarget(null)} onInsert={insertMath} />}
            </Suspense>
        </AuthenticatedLayout>
    );
}
