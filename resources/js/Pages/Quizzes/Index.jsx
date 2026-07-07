import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import MathText, { hasMath } from '@/Components/MathText';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import {
    PlusIcon, PencilSquareIcon, TrashIcon, ArrowLeftIcon, CheckCircleIcon,
    LinkIcon, ChartBarIcon, LockClosedIcon, LockOpenIcon, PuzzlePieceIcon,
    XMarkIcon, ExclamationCircleIcon, QrCodeIcon, DocumentDuplicateIcon,
    ArchiveBoxIcon, ClockIcon,
} from '@heroicons/react/24/outline';

const emptyQuestion = () => ({ q: '', options: ['', ''], answer: 0 });

// datetime-local <-> ISO UTC (browser yang konversi zona waktu)
const isoToLocal = (iso) => iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
const localToIso = (s) => s ? new Date(s).toISOString() : null;

const emptyForm = (subjects) => ({
    title: '', subject_id: subjects[0]?.id ?? '', questions: [emptyQuestion()],
    duration_minutes: '', opens_at: '', closes_at: '',
    shuffle_questions: false, shuffle_options: false, show_result: true,
});

export default function QuizzesIndex({ classroom, quizzes, subjects, studentsCount }) {
    const { flash } = usePage().props;
    const [modal, setModal] = useState({ open: false, editing: null });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [qrTarget, setQrTarget] = useState(null);
    const [bank, setBank] = useState({ open: false, items: null, subjectId: 'all', checked: {} });
    const form = useForm(emptyForm(subjects));

    const questionsLocked = modal.editing && modal.editing.attempts_count > 0;

    const openCreate = () => {
        form.clearErrors();
        form.setData(emptyForm(subjects));
        setModal({ open: true, editing: null });
    };
    const openEdit = (quiz) => {
        form.clearErrors();
        form.setData({
            title: quiz.title, subject_id: quiz.subject_id, questions: quiz.questions,
            duration_minutes: quiz.duration_minutes ?? '',
            opens_at: isoToLocal(quiz.opens_at), closes_at: isoToLocal(quiz.closes_at),
            shuffle_questions: quiz.shuffle_questions, shuffle_options: quiz.shuffle_options,
            show_result: quiz.show_result,
        });
        setModal({ open: true, editing: quiz });
    };
    const closeModal = () => setModal({ open: false, editing: null });

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeModal };
        const transform = (data) => ({
            ...data,
            duration_minutes: data.duration_minutes || null,
            opens_at: localToIso(data.opens_at),
            closes_at: localToIso(data.closes_at),
        });
        form.transform(transform);
        if (modal.editing) form.put(route('quizzes.update', modal.editing.id), opts);
        else form.post(route('quizzes.store', classroom.id), opts);
    };

    const setQuestion = (i, patch) => {
        const questions = [...form.data.questions];
        questions[i] = { ...questions[i], ...patch };
        form.setData('questions', questions);
    };
    const setOption = (i, j, value) => {
        const options = [...form.data.questions[i].options];
        options[j] = value;
        setQuestion(i, { options });
    };
    const addOption = (i) => setQuestion(i, { options: [...form.data.questions[i].options, ''] });
    const removeOption = (i, j) => {
        const q = form.data.questions[i];
        setQuestion(i, {
            options: q.options.filter((_, k) => k !== j),
            answer: q.answer === j ? 0 : q.answer > j ? q.answer - 1 : q.answer,
        });
    };
    const removeQuestion = (i) => form.setData('questions', form.data.questions.filter((_, k) => k !== i));

    // --- Bank soal picker ---
    const openBank = async () => {
        setBank((b) => ({ ...b, open: true, checked: {} }));
        if (!bank.items) {
            const { data } = await axios.get(route('bank-questions.list'));
            setBank((b) => ({ ...b, items: data }));
        }
    };
    const addFromBank = () => {
        const picked = (bank.items ?? []).filter((it) => bank.checked[it.id]);
        // Soal kosong bawaan form dibuang kalau masih polos
        const current = form.data.questions.filter((q) => q.q.trim() !== '' || q.options.some((o) => o.trim() !== ''));
        form.setData('questions', [
            ...current,
            ...picked.map((it) => ({ q: it.q, options: it.options, answer: it.answer })),
        ]);
        setBank((b) => ({ ...b, open: false, checked: {} }));
    };
    const bankFiltered = (bank.items ?? []).filter((it) => bank.subjectId === 'all' || it.subject_id === Number(bank.subjectId));

    const copyLink = (quiz) => {
        navigator.clipboard.writeText(`${window.location.origin}/kuis/${quiz.token}`);
        setCopiedId(quiz.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleOpen = (quiz) => {
        router.put(route('quizzes.update', quiz.id), { is_open: !quiz.is_open }, { preserveScroll: true });
    };

    const duplicate = (quiz) => {
        router.post(route('quizzes.duplicate', quiz.id), {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        router.delete(route('quizzes.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    const scheduleLabel = (quiz) => {
        const fmt = (iso) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        if (quiz.opens_at && quiz.closes_at) return `${fmt(quiz.opens_at)} – ${fmt(quiz.closes_at)}`;
        if (quiz.closes_at) return `s.d. ${fmt(quiz.closes_at)}`;
        if (quiz.opens_at) return `mulai ${fmt(quiz.opens_at)}`;
        return null;
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Kuis - ${classroom.name}`} />

            <div className="py-2 sm:py-8 relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Link href={route('dashboard')} className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/45 border border-white dark:border-slate-800/80 text-gray-600 dark:text-slate-300 hover:bg-white transition active:scale-95">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">Kuis Online</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">{classroom.name} · {quizzes.length} kuis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={route('bank-questions.index')} className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-slate-900/45 border border-gray-200 dark:border-slate-800/80 hover:bg-white text-gray-700 dark:text-slate-200 font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95">
                                <ArchiveBoxIcon className="w-4 h-4" /> Bank Soal
                            </Link>
                            <button onClick={openCreate} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-500/30 transition-all active:scale-95">
                                <PlusIcon className="w-4 h-4" /> Buat Kuis
                            </button>
                        </div>
                    </div>

                    {/* Flash */}
                    {flash?.success && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4">
                            <p className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                                <CheckCircleIcon className="w-5 h-5 shrink-0" /> {flash.success}
                            </p>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4">
                            <p className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 text-sm">
                                <ExclamationCircleIcon className="w-5 h-5 shrink-0" /> {flash.error}
                            </p>
                        </div>
                    )}

                    {/* List */}
                    {quizzes.length === 0 ? (
                        <div className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-xl dark:shadow-none">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <PuzzlePieceIcon className="w-8 h-8 text-indigo-300 dark:text-indigo-400" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-400 dark:text-slate-400">Belum ada kuis</h4>
                            <p className="text-gray-400 dark:text-slate-500 mt-1 text-sm">Buat kuis pertama, lalu bagikan linknya ke siswa lewat WA.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {quizzes.map((quiz) => (
                                <motion.div key={quiz.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/70 dark:bg-slate-900/45 backdrop-blur-xl border border-white dark:border-slate-800/80 rounded-3xl p-5 shadow-xl dark:shadow-none">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 truncate">{quiz.title}</h4>
                                                {quiz.is_open ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                                                        <LockOpenIcon className="w-3 h-3" /> Dibuka
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                                                        <LockClosedIcon className="w-3 h-3" /> Ditutup
                                                    </span>
                                                )}
                                                {!quiz.show_result && (
                                                    <span className="text-xs font-bold text-violet-700 dark:text-violet-400 bg-violet-100/80 dark:bg-violet-950/40 px-2.5 py-0.5 rounded-full">Mode Ujian</span>
                                                )}
                                                {quiz.duration_minutes && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-950/40 px-2.5 py-0.5 rounded-full">
                                                        <ClockIcon className="w-3 h-3" /> {quiz.duration_minutes} mnt
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold mt-0.5">
                                                {quiz.subject?.name} · {quiz.questions.length} soal · {quiz.attempts_count}/{studentsCount} siswa mengerjakan
                                                {scheduleLabel(quiz) && <> · 🗓 {scheduleLabel(quiz)}</>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button onClick={() => copyLink(quiz)}
                                                className={`inline-flex items-center gap-1.5 font-bold text-sm py-2 px-3.5 rounded-xl transition-all active:scale-95 ${copiedId === quiz.id ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-indigo-50 dark:bg-indigo-950/45 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'}`}>
                                                <LinkIcon className="w-4 h-4" /> {copiedId === quiz.id ? 'Tersalin!' : 'Salin Link'}
                                            </button>
                                            <button onClick={() => setQrTarget(quiz)} title="Tampilkan QR"
                                                className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/45 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 transition active:scale-95">
                                                <QrCodeIcon className="w-4 h-4" />
                                            </button>
                                            <Link href={route('quizzes.results', quiz.id)}
                                                className="inline-flex items-center gap-1.5 bg-gray-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold text-sm py-2 px-3.5 rounded-xl transition-all active:scale-95">
                                                <ChartBarIcon className="w-4 h-4" /> Hasil
                                            </Link>
                                            <button onClick={() => toggleOpen(quiz)} title={quiz.is_open ? 'Tutup kuis' : 'Buka kuis'}
                                                className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition active:scale-95">
                                                {quiz.is_open ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => duplicate(quiz)} title="Duplikat kuis"
                                                className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition active:scale-95">
                                                <DocumentDuplicateIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => openEdit(quiz)} title={quiz.attempts_count > 0 ? 'Edit (soal terkunci)' : 'Edit'}
                                                className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition active:scale-95">
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteTarget(quiz)} title="Hapus"
                                                className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition active:scale-95">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Buat/Edit Kuis */}
            <Modal show={modal.open} onClose={closeModal} maxWidth="2xl">
                <form onSubmit={submit} className="p-6 max-h-[85vh] overflow-y-auto">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{modal.editing ? 'Edit Kuis' : 'Buat Kuis Baru'}</h2>

                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Judul Kuis</label>
                            <input type="text" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} autoFocus
                                placeholder="Mis. Kuis Bab 3 - Pecahan"
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            {form.errors.title && <p className="mt-1 text-sm text-rose-600">{form.errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Mata Pelajaran</label>
                            <select value={form.data.subject_id} onChange={(e) => form.setData('subject_id', e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {form.errors.subject_id && <p className="mt-1 text-sm text-rose-600">{form.errors.subject_id}</p>}
                        </div>
                    </div>

                    {/* Pengaturan */}
                    <div className="mt-5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/40 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-3">Pengaturan</p>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Durasi (menit)</label>
                                <input type="number" min="1" max="600" value={form.data.duration_minutes}
                                    onChange={(e) => form.setData('duration_minutes', e.target.value)}
                                    placeholder="Tanpa batas"
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Buka mulai</label>
                                <input type="datetime-local" value={form.data.opens_at}
                                    onChange={(e) => form.setData('opens_at', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Tutup pada</label>
                                <input type="datetime-local" value={form.data.closes_at}
                                    onChange={(e) => form.setData('closes_at', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                                <input type="checkbox" checked={form.data.shuffle_questions} onChange={(e) => form.setData('shuffle_questions', e.target.checked)}
                                    className="rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                                Acak urutan soal
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                                <input type="checkbox" checked={form.data.shuffle_options} onChange={(e) => form.setData('shuffle_options', e.target.checked)}
                                    className="rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                                Acak pilihan jawaban
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                                <input type="checkbox" checked={!form.data.show_result} onChange={(e) => form.setData('show_result', !e.target.checked)}
                                    className="rounded border-gray-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500" />
                                Mode Ujian (skor & kunci disembunyikan dari siswa)
                            </label>
                        </div>
                    </div>

                    {/* Soal */}
                    {questionsLocked ? (
                        <div className="mt-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 text-sm font-semibold text-amber-700 dark:text-amber-300">
                            🔒 Soal terkunci karena sudah ada siswa yang mengerjakan. Judul & pengaturan tetap bisa diubah — duplikat kuis kalau perlu revisi soal.
                        </div>
                    ) : (
                        <>
                            <div className="mt-5 flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-slate-400">Soal ({form.data.questions.length})</p>
                                <button type="button" onClick={openBank}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    <ArchiveBoxIcon className="w-4 h-4" /> Ambil dari Bank Soal
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                                💡 Rumus matematika: apit dengan tanda dolar, mis. <code className="font-mono">{'$\\frac{1}{2}x^2$'}</code> — preview muncul otomatis.
                            </p>
                            <div className="mt-2 space-y-5">
                                {form.data.questions.map((question, i) => (
                                    <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/40 p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-xs font-black uppercase tracking-wide text-indigo-500 dark:text-indigo-400">Soal {i + 1}</span>
                                            {form.data.questions.length > 1 && (
                                                <button type="button" onClick={() => removeQuestion(i)} className="p-1 rounded-md text-gray-400 hover:text-rose-500 transition">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <textarea value={question.q} onChange={(e) => setQuestion(i, { q: e.target.value })} rows={2}
                                            placeholder="Tulis pertanyaan di sini..."
                                            className="mt-2 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                                        {form.errors[`questions.${i}.q`] && <p className="mt-1 text-sm text-rose-600">{form.errors[`questions.${i}.q`]}</p>}

                                        <div className="mt-3 space-y-2">
                                            {question.options.map((opt, j) => (
                                                <div key={j} className="flex items-center gap-2">
                                                    <input type="radio" name={`answer-${i}`} checked={question.answer === j} onChange={() => setQuestion(i, { answer: j })}
                                                        title="Tandai sebagai kunci jawaban"
                                                        className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-slate-600 focus:ring-emerald-500" />
                                                    <input type="text" value={opt} onChange={(e) => setOption(i, j, e.target.value)}
                                                        placeholder={`Pilihan ${String.fromCharCode(65 + j)}`}
                                                        className={`flex-1 rounded-lg px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${question.answer === j ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-gray-300 dark:border-slate-700'}`} />
                                                    {question.options.length > 2 && (
                                                        <button type="button" onClick={() => removeOption(i, j)} className="p-1 rounded-md text-gray-400 hover:text-rose-500 transition">
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {form.errors[`questions.${i}.options`] && <p className="text-sm text-rose-600">{form.errors[`questions.${i}.options`]}</p>}
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            {question.options.length < 5 ? (
                                                <button type="button" onClick={() => addOption(i)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    + Tambah pilihan
                                                </button>
                                            ) : <span />}
                                            <span className="text-xs text-gray-400 dark:text-slate-500">Klik bulatan = kunci jawaban</span>
                                        </div>

                                        {/* Preview rumus (muncul kalau ada $...$) */}
                                        {hasMath(question.q, question.options) && (
                                            <div className="mt-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-900 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-wide text-indigo-400 mb-1.5">Preview tampilan siswa</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200"><MathText text={question.q} /></p>
                                                <ul className="mt-1.5 space-y-0.5">
                                                    {question.options.map((opt, j) => (
                                                        <li key={j} className="text-sm text-gray-600 dark:text-slate-400">
                                                            {String.fromCharCode(65 + j)}. <MathText text={opt} />
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {form.data.questions.length < 100 && (
                                <button type="button" onClick={() => form.setData('questions', [...form.data.questions, emptyQuestion()])}
                                    className="mt-4 w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-sm font-bold text-gray-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                                    + Tambah Soal
                                </button>
                            )}
                            {form.errors.questions && <p className="mt-2 text-sm text-rose-600">{form.errors.questions}</p>}
                        </>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50">
                            {modal.editing ? 'Simpan' : 'Buat Kuis'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Picker Bank Soal */}
            <Modal show={bank.open} onClose={() => setBank((b) => ({ ...b, open: false }))} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Ambil dari Bank Soal</h2>
                        <select value={bank.subjectId} onChange={(e) => setBank((b) => ({ ...b, subjectId: e.target.value }))}
                            className="rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="all">Semua mapel</option>
                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
                        {bank.items === null ? (
                            <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">Memuat...</p>
                        ) : bankFiltered.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">
                                Bank soal kosong. Tambahkan soal lewat halaman <Link href={route('bank-questions.index')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Bank Soal</Link>.
                            </p>
                        ) : bankFiltered.map((it) => (
                            <label key={it.id} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${bank.checked[it.id] ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-700' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}>
                                <input type="checkbox" checked={!!bank.checked[it.id]}
                                    onChange={(e) => setBank((b) => ({ ...b, checked: { ...b.checked, [it.id]: e.target.checked } }))}
                                    className="mt-1 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200"><MathText text={it.q} /></p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        {it.subject?.name}{it.materi ? ` · ${it.materi}` : ''}{it.difficulty ? ` · ${it.difficulty}` : ''} · {it.options.length} pilihan
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="mt-5 flex justify-end gap-3">
                        <button type="button" onClick={() => setBank((b) => ({ ...b, open: false }))} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button type="button" onClick={addFromBank} disabled={!Object.values(bank.checked).some(Boolean)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition disabled:opacity-50">
                            Tambahkan {Object.values(bank.checked).filter(Boolean).length} soal
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal QR Code */}
            <Modal show={!!qrTarget} onClose={() => setQrTarget(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{qrTarget?.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Scan untuk langsung buka kuis</p>
                    <div className="mt-4 bg-white p-4 rounded-2xl inline-block">
                        {qrTarget && <QRCode value={`${window.location.origin}/kuis/${qrTarget.token}`} size={200} />}
                    </div>
                    <p className="mt-3 font-mono text-sm text-gray-500 dark:text-slate-400">/kuis/{qrTarget?.token}</p>
                </div>
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Hapus kuis "{deleteTarget?.title}"?</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Semua hasil pengerjaan siswa di kuis ini ikut terhapus permanen. Nilai yang sudah disalin ke rekap Nilai tetap aman.</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                        <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-white shadow-md shadow-rose-500/30 transition">Ya, Hapus</button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
