import MathText from '@/Components/MathText';
import { MediaView } from '@/Components/QuestionMedia';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { MathfieldElement } from 'mathlive';
import 'mathlive/fonts.css';

MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

// Efek suara digenerate Web Audio (oscillator) — tanpa file aset.
let audioCtx = null;
const tone = (freq, at, dur, { type = 'sine', gain = 0.12 } = {}) => {
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + at;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
};
const SFX = {
    correct: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25)), // arpeggio C-E-G-C naik
    wrong: () => [160, 120].forEach((f, i) => tone(f, i * 0.15, 0.2, { type: 'sawtooth', gain: 0.08 })),
    tick: () => tone(1200, 0, 0.06, { type: 'square', gain: 0.05 }),
    timeup: () => [440, 330, 220].forEach((f, i) => tone(f, i * 0.18, 0.3, { type: 'triangle' })),
    finish: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3)),
};

// Layar game di proyektor: soal di atas, input jawaban di bawah.
// Siswa maju ke laptop guru, ketik jawaban (MathLive: ^ pangkat, sqrt akar), Enter.
// Benar → soal berikutnya. Waktu habis / guru skip → kunci tampil dulu.
export default function GamePlay({ game, questions }) {
    const [idx, setIdx] = useState(0);
    // status: answering | correct | timeout (bahas dulu, kunci belum tampil) | revealed | finished
    const [status, setStatus] = useState(questions.length ? 'answering' : 'finished');
    const [timeLeft, setTimeLeft] = useState(game.timer_seconds);
    const [revealedKey, setRevealedKey] = useState('');
    const [wrongFlash, setWrongFlash] = useState(0); // key untuk retrigger animasi shake
    const [paused, setPaused] = useState(false);
    const [skipArmed, setSkipArmed] = useState(false); // klik 1 = konfirmasi, klik 2 = lewati
    const [results, setResults] = useState([]); // rekap per soal: {q, outcome: correct|timeout}
    const [fullscreen, setFullscreen] = useState(false);
    const mfRef = useRef(null);
    const busyRef = useRef(false); // guard sinkron — Enter & klik Jawab bisa datang barengan
    const stateRef = useRef({});
    stateRef.current = { idx, status, paused };

    useEffect(() => {
        const onFs = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, []);
    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
    };

    useEffect(() => {
        if (!skipArmed) return;
        const t = setTimeout(() => setSkipArmed(false), 3000); // batal otomatis kalau tidak diklik lagi
        return () => clearTimeout(t);
    }, [skipArmed]);

    const [muted, setMuted] = useState(() => localStorage.getItem('game_muted') === '1');
    const mutedRef = useRef(muted);
    mutedRef.current = muted;
    const toggleMute = () => {
        localStorage.setItem('game_muted', muted ? '0' : '1');
        setMuted(!muted);
    };
    // AudioContext dibuat saat suara pertama — sudah pasti ada gesture user (ketik/klik)
    const play = (name) => {
        if (mutedRef.current) return;
        try {
            audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            SFX[name]();
        } catch { /* audio bukan fitur kritis */ }
    };

    const question = questions[idx];

    // Timer per soal — jalan hanya saat menjawab & tidak dijeda; 5 detik terakhir bunyi tick
    useEffect(() => {
        if (status !== 'answering' || paused) return;
        if (timeLeft <= 0) { timeUp(); return; }
        if (timeLeft <= 5) play('tick');
        const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [status, timeLeft, paused]);

    // Submit via Enter fisik (keydown) ATAU event change MathLive ATAU tombol Jawab —
    // busyRef memastikan hanya satu yang jalan. Listener sekali, baca state via ref.
    useEffect(() => {
        const mf = mfRef.current;
        if (!mf) return;
        const onChange = () => submitRef.current();
        const onKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submitRef.current(); } };
        const onInput = (e) => { if (e.inputType === 'insertLineBreak') submitRef.current(); };
        mf.addEventListener('change', onChange);
        mf.addEventListener('keydown', onKeyDown);
        mf.addEventListener('input', onInput);
        mf.focus();
        return () => {
            mf.removeEventListener('change', onChange);
            mf.removeEventListener('keydown', onKeyDown);
            mf.removeEventListener('input', onInput);
        };
    }, []);

    const submitRef = useRef(() => {});
    submitRef.current = async () => {
        const { idx, status, paused } = stateRef.current;
        const mf = mfRef.current;
        if (status !== 'answering' || paused || busyRef.current || !mf) return;
        // ascii-math ("x^2", "sqrt(3)", "1/2") paling dekat dengan gaya kunci yang diketik guru
        const answer = (mf.getValue('ascii-math') || mf.value || '').trim();
        if (!answer) return;

        busyRef.current = true;
        let correct = false;
        try {
            const { data } = await axios.post(route('games.check', game.token), {
                question_id: questions[idx].id, answer,
            });
            correct = data.correct;
            if (correct) {
                play('correct');
                setResults((r) => [...r, { q: questions[idx].q, outcome: 'correct' }]);
                setStatus('correct');
                setTimeout(next, 1800);
            } else {
                play('wrong');
                setWrongFlash((k) => k + 1);
                mf.value = '';
                mf.focus();
            }
        } finally {
            // benar → busy tetap true sampai next(), cegah dobel-lanjut
            if (!correct) busyRef.current = false;
        }
    };

    // Waktu habis / dilewati → soal tetap tampil untuk dibahas; kunci baru
    // muncul saat guru klik "Tampilkan Jawaban" (reveal).
    const timeUp = () => {
        play('timeup');
        setSkipArmed(false);
        setResults((r) => [...r, { q: questions[stateRef.current.idx].q, outcome: 'timeout' }]);
        setStatus('timeout');
    };

    const reveal = async () => {
        setStatus('revealed');
        try {
            const { data } = await axios.post(route('games.reveal', game.token), {
                question_id: questions[stateRef.current.idx].id,
            });
            setRevealedKey(data.answer);
        } catch {
            setRevealedKey('—');
        }
    };

    // Lewati butuh dua klik — sekali kepencet tidak langsung menghentikan soal
    const skip = () => {
        if (!skipArmed) { setSkipArmed(true); return; }
        setSkipArmed(false);
        timeUp();
    };

    const next = () => {
        const i = stateRef.current.idx;
        busyRef.current = false;
        setPaused(false);
        setSkipArmed(false);
        if (mfRef.current) mfRef.current.value = '';
        setRevealedKey('');
        if (i + 1 >= questions.length) { play('finish'); setStatus('finished'); return; }
        setIdx(i + 1);
        setTimeLeft(game.timer_seconds);
        setStatus('answering');
        setTimeout(() => mfRef.current?.focus(), 50);
    };

    const restart = () => {
        busyRef.current = false;
        setIdx(0);
        setTimeLeft(game.timer_seconds);
        setRevealedKey('');
        setResults([]);
        setPaused(false);
        setSkipArmed(false);
        if (mfRef.current) mfRef.current.value = '';
        setStatus('answering');
        setTimeout(() => mfRef.current?.focus(), 50);
    };

    const timerColor = timeLeft <= 5 ? 'text-rose-400' : timeLeft <= 15 ? 'text-amber-300' : 'text-cyan-300';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
            <Head title={game.name} />
            {/* latar glow ala arena */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_60%)]" />

            {/* Bar atas: nama game, progress, timer */}
            <div className="relative flex items-center justify-between px-6 sm:px-10 py-4 border-b border-slate-800/80">
                <div className="min-w-0">
                    <p className="font-extrabold tracking-tight truncate">{game.name}</p>
                    <p className="text-xs font-bold text-slate-500">Soal {Math.min(idx + 1, questions.length)} / {questions.length}</p>
                </div>
                {status !== 'finished' && (
                    <div className={`font-mono text-4xl sm:text-5xl font-extrabold tabular-nums ${timerColor}`}>
                        {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                )}
                <div className="flex items-center gap-4">
                    {status === 'answering' && (
                        <button onClick={() => setPaused(!paused)} title={paused ? 'Lanjutkan' : 'Jeda timer'}
                            className="text-lg text-slate-500 hover:text-slate-300 transition">
                            {paused ? '▶️' : '⏸️'}
                        </button>
                    )}
                    <button onClick={toggleMute} title={muted ? 'Nyalakan suara' : 'Matikan suara'}
                        className="text-lg text-slate-500 hover:text-slate-300 transition">
                        {muted ? '🔇' : '🔊'}
                    </button>
                    <button onClick={toggleFullscreen} title={fullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                        className="text-lg text-slate-500 hover:text-slate-300 transition">
                        {fullscreen ? '🗗' : '⛶'}
                    </button>
                    <Link href={route('games.index')} className="text-xs font-bold text-slate-500 hover:text-slate-300 transition">✕ Keluar</Link>
                </div>
            </div>

            {status === 'finished' ? (
                <div className="relative flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
                    <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <p className="text-7xl">🏁</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Game Selesai!</h1>
                        <p className="mt-2 font-bold text-slate-400">
                            {results.filter((r) => r.outcome === 'correct').length} terjawab · {results.filter((r) => r.outcome === 'timeout').length} waktu habis/dilewati
                        </p>
                    </motion.div>
                    {results.length > 0 && (
                        <div className="w-full max-w-2xl max-h-64 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/80 text-left">
                            {results.map((r, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                                    <span className="shrink-0">{r.outcome === 'correct' ? '✅' : '⏱'}</span>
                                    <span className="text-sm text-slate-300 truncate"><MathText text={r.q} /></span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button onClick={restart} className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-extrabold transition active:scale-95">↻ Main Lagi</button>
                        <Link href={route('games.index')} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-extrabold transition">Kembali</Link>
                    </div>
                </div>
            ) : (
                <div className="relative flex-1 flex flex-col max-w-5xl w-full mx-auto p-6 sm:p-10 gap-6">
                    {/* Soal */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
                        {question.stimulus && (
                            <p className="max-w-3xl max-h-48 overflow-y-auto text-slate-300 text-lg whitespace-pre-wrap text-left rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                                {question.stimulus}
                            </p>
                        )}
                        <MediaView media={question.media} className="mx-auto" />
                        <h1 className="text-3xl sm:text-5xl font-extrabold leading-snug [&_.katex]:text-[1.1em]">
                            <MathText text={question.q} />
                        </h1>
                    </div>

                    {/* Waktu habis → soal tetap tampil, bahas dulu; kunci menunggu klik guru */}
                    {status === 'timeout' && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 flex items-center justify-between gap-4 flex-wrap">
                            <p className="font-extrabold text-amber-300">⏱ Waktu habis — bahas dulu cara mengerjakannya</p>
                            <div className="flex gap-3">
                                <button onClick={reveal} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition active:scale-95">
                                    💡 Tampilkan Jawaban
                                </button>
                                <button onClick={next} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-extrabold transition active:scale-95">
                                    {idx + 1 >= questions.length ? 'Selesai 🏁' : 'Soal Berikutnya →'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Input jawaban */}
                    <motion.div key={wrongFlash} animate={wrongFlash ? { x: [0, -14, 14, -8, 8, 0] } : false} transition={{ duration: 0.4 }}
                        className={status === 'timeout' ? 'hidden' : ''}>
                        <div className={`rounded-2xl p-[2px] transition-colors ${wrongFlash ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'}`}>
                            <div className="rounded-2xl bg-slate-900 p-4 sm:p-5 flex items-center gap-4">
                                <math-field
                                    ref={mfRef}
                                    class="flex-1 block rounded-xl bg-white text-slate-900 px-4 py-3 text-2xl sm:text-3xl shadow-inner"
                                />
                                <button onClick={() => submitRef.current()} disabled={status !== 'answering'}
                                    className="shrink-0 px-5 sm:px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-extrabold text-lg transition active:scale-95">
                                    Jawab ⏎
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                            <span>Ketik <code className="text-slate-400">^</code> untuk pangkat · <code className="text-slate-400">sqrt</code> untuk akar · <code className="text-slate-400">/</code> untuk pecahan</span>
                            <button onClick={skip} disabled={status !== 'answering'}
                                className={`transition disabled:opacity-40 ${skipArmed ? 'text-rose-400 hover:text-rose-300 animate-pulse' : 'hover:text-slate-300'}`}>
                                {skipArmed ? 'Yakin? Klik lagi untuk lewati' : 'Lewati soal →'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Overlay jeda / benar / kunci jawaban */}
            <AnimatePresence>
                {paused && status === 'answering' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                        <div className="text-center">
                            <p className="text-7xl">⏸</p>
                            <p className="mt-4 text-4xl font-extrabold tracking-tight">Dijeda</p>
                            <button onClick={() => setPaused(false)} className="mt-8 px-8 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-extrabold text-lg transition active:scale-95">
                                ▶ Lanjutkan
                            </button>
                        </div>
                    </motion.div>
                )}
                {status === 'correct' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-600/90 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} className="text-center">
                            <p className="text-8xl">🎉</p>
                            <p className="mt-4 text-6xl font-extrabold tracking-tight text-white">BENAR!</p>
                        </motion.div>
                    </motion.div>
                )}
                {status === 'revealed' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
                        <div className="text-center px-6">
                            <p className="text-sm font-extrabold uppercase tracking-widest text-slate-500">💡 Jawabannya</p>
                            <p className="mt-4 text-5xl sm:text-6xl font-extrabold text-cyan-300 break-all">
                                {revealedKey ? <MathText text={revealedKey} /> : '…'}
                            </p>
                            <button onClick={next} className="mt-10 px-8 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-extrabold text-lg transition active:scale-95">
                                {idx + 1 >= questions.length ? 'Selesai 🏁' : 'Soal Berikutnya →'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
