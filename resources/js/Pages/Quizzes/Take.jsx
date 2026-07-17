import { Head, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import MathText from '@/Components/MathText';
import { MediaView } from '@/Components/QuestionMedia';

// Warna tombol pilihan gaya Quizizz — shade dipilih agar kontras teks lolos WCAG
// (kuning pakai teks gelap, putih di atas kuning tidak terbaca)
const OPTION_COLORS = [
    'bg-rose-600 hover:bg-rose-700 text-white',
    'bg-sky-600 hover:bg-sky-700 text-white',
    'bg-amber-400 hover:bg-amber-500 text-amber-950',
    'bg-emerald-600 hover:bg-emerald-700 text-white',
    'bg-violet-600 hover:bg-violet-700 text-white',
];

const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmtDateTime = (iso) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CLOSED_MESSAGES = {
    closed: () => 'Kuis sudah ditutup oleh guru.',
    not_open_yet: (quiz) => `Kuis baru dibuka ${quiz.opens_at ? fmtDateTime(quiz.opens_at) : 'nanti'}. Datang lagi ya!`,
    ended: (quiz) => `Waktu pengerjaan sudah berakhir${quiz.closes_at ? ` (${fmtDateTime(quiz.closes_at)})` : ''}.`,
};

export default function QuizTake({ quiz, students, doneStudentIds }) {
    const { flash } = usePage().props;
    const [step, setStep] = useState(-1); // -1 = pilih nama, 0..n-1 = index tampilan soal
    // Jawaban diindeks pakai index soal ASLI (q.i) — aman untuk mode acak
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const startedAtRef = useRef(null);
    const submittedRef = useRef(false);
    const form = useForm({ student_id: '', answers: [], duration_seconds: 0 });
    const result = flash?.quiz_result;

    const total = quiz.total_questions;
    // "Terjawab" tergantung tipe: jodoh = semua pasangan terisi, teks = non-kosong
    const isAnswered = (q) => {
        const a = answers[q.i];
        if (a === undefined || a === null) return false;
        if (q.type === 'jodoh') return q.lefts.every((_, k) => a[k] !== null && a[k] !== undefined);
        if (typeof a === 'string') return a.trim() !== '';
        return true;
    };
    const answeredCount = quiz.questions.filter(isAnswered).length;
    const studentName = students.find((s) => s.id === Number(form.data.student_id))?.name;

    // Progres disimpan di localStorage: refresh tidak menghapus jawaban dan
    // timer lanjut dari waktu mulai semula (tidak bisa di-reset via refresh).
    const storeKey = `quiz-progress-${quiz.token}`;

    useEffect(() => {
        if (result || quiz.closed_reason) return;
        try {
            const saved = JSON.parse(localStorage.getItem(storeKey) || 'null');
            if (!saved || !saved.startedAt) return;
            if (doneStudentIds.includes(saved.student_id)) { localStorage.removeItem(storeKey); return; }
            form.setData('student_id', String(saved.student_id));
            setAnswers(saved.answers ?? {});
            startedAtRef.current = saved.startedAt;
            if (quiz.duration_minutes) {
                // Sisa waktu dihitung dari waktu mulai asli; kalau sudah habis,
                // countdown effect langsung auto-submit.
                setTimeLeft(Math.max(0, quiz.duration_minutes * 60 - Math.round((Date.now() - saved.startedAt) / 1000)));
            }
            setStep(Math.min(saved.step ?? 0, quiz.questions.length - 1));
        } catch { /* data korup → mulai normal */ }
    }, []);

    useEffect(() => {
        if (step < 0 || result) return;
        localStorage.setItem(storeKey, JSON.stringify({
            student_id: Number(form.data.student_id),
            startedAt: startedAtRef.current,
            answers,
            step,
        }));
    }, [answers, step]);

    useEffect(() => {
        if (result) localStorage.removeItem(storeKey);
    }, [result]);

    const doSubmit = () => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        form.transform((data) => ({
            ...data,
            answers: Array.from({ length: total }, (_, k) => answers[k] ?? null),
            duration_seconds: startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : 0,
        }));
        form.post(route('quiz.submit', quiz.token), {
            preserveScroll: true,
            onError: () => { submittedRef.current = false; },
        });
    };

    const start = () => {
        startedAtRef.current = Date.now();
        if (quiz.duration_minutes) setTimeLeft(quiz.duration_minutes * 60);
        setStep(0);
    };

    // Countdown timer + auto-submit saat habis
    useEffect(() => {
        if (timeLeft === null || result) return;
        if (timeLeft <= 0) { doSubmit(); return; }
        const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, result]);

    const pick = (dispIdx, origQ, origOpt) => {
        setAnswers((a) => ({ ...a, [origQ]: origOpt }));
        if (dispIdx < quiz.questions.length - 1) {
            setTimeout(() => setStep(dispIdx + 1), 200);
        }
    };
    const setText = (origQ, value) => setAnswers((a) => ({ ...a, [origQ]: value }));
    const setMatch = (origQ, k, value, pairCount) => setAnswers((a) => {
        const arr = Array.isArray(a[origQ]) ? [...a[origQ]] : Array(pairCount).fill(null);
        arr[k] = value === '' ? null : Number(value);
        return { ...a, [origQ]: arr };
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center p-4">
            <Head title={quiz.title} />

            <div className="w-full max-w-2xl">
                {/* Kartu judul */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">{quiz.title}</h1>
                    <p className="text-white/80 font-semibold text-sm mt-1">{quiz.subject} · {quiz.classroom}</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8">
                    {/* Kuis tertutup (manual / jadwal) */}
                    {quiz.closed_reason && !result ? (
                        <div className="text-center py-8">
                            <p className="text-5xl mb-4">{quiz.closed_reason === 'not_open_yet' ? '⏳' : '🔒'}</p>
                            <h2 className="text-xl font-black text-gray-900">
                                {quiz.closed_reason === 'not_open_yet' ? 'Belum dibuka' : 'Kuis sudah ditutup'}
                            </h2>
                            <p className="text-gray-500 mt-2 text-sm">{CLOSED_MESSAGES[quiz.closed_reason](quiz)}</p>
                        </div>

                    ) : result && !result.show_result ? (
                        /* Mode ujian: hanya konfirmasi terkirim */
                        <div className="text-center py-8">
                            <p className="text-6xl mb-4">📬</p>
                            <h2 className="text-xl font-black text-gray-900">Jawaban terkirim!</h2>
                            <p className="text-gray-500 mt-2 text-sm">Nilai akan diumumkan oleh gurumu. Semangat!</p>
                        </div>

                    ) : result ? (
                        /* Hasil mode latihan */
                        <div className="text-center">
                            <p className="text-6xl mb-3">{result.score >= 80 ? '🎉' : result.score >= 60 ? '👍' : '💪'}</p>
                            <h2 className="text-lg font-bold text-gray-500">Skor kamu{studentName ? `, ${studentName}` : ''}</h2>
                            <p className={`text-6xl font-black my-2 ${result.score >= 80 ? 'text-emerald-500' : result.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                                {result.score}
                            </p>
                            <p className="font-bold text-gray-600">{result.correct} dari {result.total} soal benar</p>
                            {result.pending_essays > 0 && (
                                <p className="mt-2 text-sm font-bold text-violet-600 bg-violet-50 rounded-xl px-4 py-2 inline-block">
                                    ✍️ Nilai sementara — {result.pending_essays} soal esai menunggu penilaian gurumu.
                                </p>
                            )}

                            {/* Review jawaban (urutan tampilan siswa) */}
                            <div className="mt-6 space-y-3 text-left max-h-72 overflow-y-auto">
                                {quiz.questions.map((q) => {
                                    const r = result.review[q.i];
                                    if (r.type === 'esai') {
                                        return (
                                            <div key={q.i} className="rounded-xl p-3 text-sm border bg-violet-50 border-violet-200">
                                                <p className="font-bold text-gray-800">✍️ <MathText text={q.q} /></p>
                                                <p className="mt-1 text-violet-700 font-semibold">Menunggu penilaian guru.</p>
                                            </div>
                                        );
                                    }
                                    const keyText = r.type === 'pg' ? q.options.find((o) => o.i === r.answer)?.text : r.answer;
                                    return (
                                        <div key={q.i} className={`rounded-xl p-3 text-sm border ${r.correct ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                            <p className="font-bold text-gray-800">{r.correct ? '✅' : '❌'} <MathText text={q.q} /></p>
                                            {r.type === 'jodoh' && (
                                                <>
                                                    <p className="mt-1 font-semibold text-gray-600">{r.matched} dari {r.total} pasangan benar</p>
                                                    {!r.correct && (
                                                        <ul className="mt-1 text-emerald-700 font-semibold space-y-0.5">
                                                            {r.pairs.map((p, k) => <li key={k}><MathText text={p.left} /> → <MathText text={p.right} /></li>)}
                                                        </ul>
                                                    )}
                                                </>
                                            )}
                                            {r.type !== 'jodoh' && !r.correct && keyText && (
                                                <p className="mt-1 text-emerald-700 font-semibold">Jawaban benar: <MathText text={keyText} /></p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    ) : step === -1 ? (
                        /* Pilih nama */
                        <div>
                            <h2 className="text-xl font-black text-gray-900 text-center">Siapa kamu? 👋</h2>
                            <p className="text-gray-500 text-sm text-center mt-1 mb-5">
                                {total} soal menantimu.
                                {quiz.duration_minutes && <> Waktu: <span className="font-bold">{quiz.duration_minutes} menit</span>.</>}
                                {!quiz.show_result && <> <span className="font-bold text-violet-600">Mode ujian</span> — nilai diumumkan guru.</>}
                            </p>
                            <select value={form.data.student_id} onChange={(e) => form.setData('student_id', e.target.value)}
                                className="block w-full rounded-xl border-gray-300 px-4 py-3 text-base font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                <option value="">-- Pilih namamu --</option>
                                {students.map((s) => (
                                    <option key={s.id} value={s.id} disabled={doneStudentIds.includes(s.id)}>
                                        {s.name}{doneStudentIds.includes(s.id) ? ' (sudah mengerjakan)' : ''}
                                    </option>
                                ))}
                            </select>
                            {form.errors.student_id && <p className="mt-2 text-sm text-rose-600">{form.errors.student_id}</p>}
                            {flash?.error && <p className="mt-2 text-sm font-bold text-rose-600 text-center">{flash.error}</p>}
                            <button onClick={start} disabled={!form.data.student_id}
                                className="mt-5 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-500/40 transition active:scale-95 disabled:opacity-40">
                                Mulai! 🚀
                            </button>
                        </div>

                    ) : (
                        /* Soal */
                        <div>
                            {/* Progress + timer */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black text-indigo-600 uppercase tracking-wide">Soal {step + 1} / {quiz.questions.length}</span>
                                <div className="flex items-center gap-3">
                                    {timeLeft !== null && (
                                        <span className={`text-sm font-black tabular-nums ${timeLeft <= 30 ? 'text-rose-600 animate-pulse' : 'text-gray-600'}`}>
                                            ⏱ {fmtClock(Math.max(0, timeLeft))}
                                        </span>
                                    )}
                                    <span className="text-xs font-bold text-gray-400">{studentName}</span>
                                </div>
                            </div>
                            {/* Navigasi nomor soal: hijau = sudah dijawab, klik untuk lompat */}
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {quiz.questions.map((q, k) => (
                                    <button key={k} onClick={() => setStep(k)}
                                        className={`w-8 h-8 rounded-lg text-xs font-black transition active:scale-90 ${
                                            k === step ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                                            : isAnswered(q) ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                        {k + 1}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.15 }}>
                                    {quiz.questions[step].stimulus && (
                                        <div className="mb-4 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                            {quiz.questions[step].stimulus}
                                        </div>
                                    )}
                                    {quiz.questions[step].media && (
                                        <div className="mb-4 flex justify-center">
                                            <MediaView media={quiz.questions[step].media} className="w-full" />
                                        </div>
                                    )}
                                    <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-5"><MathText text={quiz.questions[step].q} /></h2>

                                    {quiz.questions[step].type === 'pg' && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {quiz.questions[step].options.map((opt, j) => (
                                                <button key={opt.i} onClick={() => pick(step, quiz.questions[step].i, opt.i)}
                                                    className={`${OPTION_COLORS[j]} font-bold text-left px-4 py-4 rounded-xl shadow-md transition active:scale-95 ${answers[quiz.questions[step].i] === opt.i ? 'ring-4 ring-gray-900/60 scale-[0.98]' : ''}`}>
                                                    <MathText text={opt.text} />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {quiz.questions[step].type === 'isian' && (
                                        <input type="text" value={answers[quiz.questions[step].i] ?? ''}
                                            onChange={(e) => setText(quiz.questions[step].i, e.target.value)}
                                            placeholder="Ketik jawabanmu di sini..."
                                            className="block w-full rounded-xl border-2 border-indigo-300 px-4 py-3.5 text-base font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                    )}

                                    {quiz.questions[step].type === 'jodoh' && (
                                        <div className="space-y-3">
                                            {quiz.questions[step].lefts.map((left, k) => (
                                                <div key={k} className="flex items-center gap-3">
                                                    <span className="flex-1 font-bold text-gray-800 text-sm sm:text-base"><MathText text={left} /></span>
                                                    <span className="text-gray-300 font-black shrink-0">→</span>
                                                    <select value={answers[quiz.questions[step].i]?.[k] ?? ''}
                                                        onChange={(e) => setMatch(quiz.questions[step].i, k, e.target.value, quiz.questions[step].lefts.length)}
                                                        className="flex-1 rounded-xl border-2 border-indigo-300 px-3 py-2.5 text-sm font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                                        <option value="">-- Pilih pasangan --</option>
                                                        {quiz.questions[step].rights.map((r) => (
                                                            <option key={r.i} value={r.i}>{r.text}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {quiz.questions[step].type === 'esai' && (
                                        <>
                                            <textarea value={answers[quiz.questions[step].i] ?? ''} rows={6}
                                                onChange={(e) => setText(quiz.questions[step].i, e.target.value)}
                                                placeholder="Tulis jawaban uraianmu di sini..."
                                                className="block w-full rounded-xl border-2 border-indigo-300 px-4 py-3 text-sm sm:text-base shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                                            <p className="mt-2 text-xs font-semibold text-gray-400">✍️ Soal uraian — dinilai langsung oleh gurumu.</p>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigasi */}
                            <div className="mt-6 flex items-center justify-between">
                                <button onClick={() => setStep(step - 1)} disabled={step === 0}
                                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 text-sm transition disabled:opacity-30">
                                    ← Sebelumnya
                                </button>
                                {step === quiz.questions.length - 1 ? (
                                    <button onClick={doSubmit} disabled={answeredCount < total || form.processing}
                                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/40 transition active:scale-95 disabled:opacity-40">
                                        {form.processing ? 'Mengirim...' : 'Kumpulkan! ✨'}
                                    </button>
                                ) : (
                                    <button onClick={() => setStep(step + 1)}
                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition">
                                        {!isAnswered(quiz.questions[step]) ? 'Lewati →' : 'Berikutnya →'}
                                    </button>
                                )}
                            </div>
                            {step === quiz.questions.length - 1 && answeredCount < total && (
                                <p className="mt-3 text-xs font-bold text-amber-600 text-center">
                                    Masih ada {total - answeredCount} soal belum dijawab — klik nomor abu-abu di atas.
                                </p>
                            )}
                            {flash?.error && <p className="mt-3 text-sm font-bold text-rose-600 text-center">{flash.error}</p>}
                        </div>
                    )}
                </div>

                <p className="text-center text-white/60 text-xs font-semibold mt-4">Dikerjakan sekali saja — jawab dengan jujur ya! ✏️</p>
            </div>
        </div>
    );
}
