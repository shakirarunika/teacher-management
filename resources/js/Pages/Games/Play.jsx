import MathText from '@/Components/MathText';
import { MediaView } from '@/Components/QuestionMedia';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { MathfieldElement } from 'mathlive';
import 'mathlive/fonts.css';

MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

// Efek suara & musik digenerate Web Audio (oscillator) — tanpa file aset,
// jadi tetap bunyi di PC kelas yang offline.
let audioCtx = null;
const ensureCtx = () => {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
};

// `to` = sapuan frekuensi (untuk buzzer melengking turun), `out` = bus tujuan
// (dipakai musik latar supaya volumenya bisa diredam terpisah dari SFX).
const tone = (freq, at, dur, { type = 'sine', gain = 0.12, to = null, out = null } = {}) => {
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    const t0 = ctx.currentTime + at;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(out || ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
};

// Derau putih untuk simbal & hi-hat — yang bikin suara terasa "berisi".
const noise = (at, dur, { gain = 0.05, hp = 4000, out = null } = {}) => {
    const ctx = audioCtx;
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hp;
    const g = ctx.createGain();
    const t0 = ctx.currentTime + at;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(g).connect(out || ctx.destination);
    src.start(t0);
    src.stop(t0 + dur);
};

const SFX = {
    // Fanfare: arpeggio naik -> akor kemenangan -> kilau oktaf, ditimpa simbal.
    correct: () => {
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.3, { type: 'triangle', gain: 0.13 }));
        [1047, 1319, 1568].forEach((f, i) => tone(f, 0.26 + i * 0.04, 0.55, { type: 'sine', gain: 0.11 }));
        [2093, 2637].forEach((f, i) => tone(f, 0.4 + i * 0.06, 0.5, { type: 'sine', gain: 0.045 }));
        noise(0, 0.18, { gain: 0.07, hp: 6000 });
        noise(0.26, 0.6, { gain: 0.05, hp: 8000 });
    },
    // Buzzer kuis: dua nada sengaja sumbang 6 Hz supaya berdenyut kasar, lalu jatuh.
    wrong: () => {
        tone(180, 0, 0.5, { type: 'square', gain: 0.11, to: 70 });
        tone(174, 0, 0.5, { type: 'sawtooth', gain: 0.09, to: 66 });
        tone(90, 0.02, 0.45, { type: 'square', gain: 0.07, to: 45 });
        noise(0, 0.22, { gain: 0.06, hp: 900 });
    },
    tick: () => tone(1200, 0, 0.06, { type: 'square', gain: 0.05 }),
    timeup: () => {
        [440, 330, 220].forEach((f, i) => tone(f, i * 0.18, 0.35, { type: 'triangle' }));
        tone(220, 0.54, 0.9, { type: 'sawtooth', gain: 0.09, to: 55 });
        noise(0.54, 0.5, { gain: 0.05, hp: 1200 });
    },
    finish: () => {
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.35));
        [1319, 1568, 2093].forEach((f, i) => tone(f, 0.78 + i * 0.05, 0.8, { type: 'sine', gain: 0.09 }));
        noise(0.78, 0.7, { gain: 0.06, hp: 7000 });
    },
};

// ---- Backsound kompetitif selama siswa mengetik jawaban ----
// Bass A-minor + hi-hat, 8 langkah per bar (120 BPM), dijadwalkan sebar-sebar
// supaya loop-nya rapat tanpa file audio.
const MUSIC_VOLUME = 0.5; // ponytail: satu knob, kalau kekencangan di aula turunkan ini
const BASS = [55, 55, 65.41, 55, 73.42, 55, 82.41, 73.42]; // A A C A D A E D
const STEP = 0.25;
let musicBus = null;
let musicTimer = null;
let musicNext = 0;

const scheduleBar = () => {
    // Browser menahan audio sampai ada interaksi user. Selama context belum
    // jalan, jangan jadwalkan apa pun — kalau dipaksa, nada menumpuk lalu
    // meletus barengan begitu context bangun.
    if (!audioCtx || audioCtx.state !== 'running' || !musicBus) return;

    const now = audioCtx.currentTime;
    const start = Math.max(musicNext, now + 0.05);

    BASS.forEach((f, i) => {
        const at = start - now + i * STEP;
        tone(f, at, 0.22, { type: 'sawtooth', gain: 0.07, out: musicBus });
        if (i % 2 === 1) noise(at, 0.035, { gain: 0.045, hp: 7000, out: musicBus });
        if (i === 0 || i === 4) tone(f * 4, at, 0.1, { type: 'square', gain: 0.025, out: musicBus });
    });

    musicNext = start + BASS.length * STEP;
};

const startMusic = () => {
    if (musicTimer) return;
    ensureCtx();
    musicBus = audioCtx.createGain();
    musicBus.gain.value = MUSIC_VOLUME;
    musicBus.connect(audioCtx.destination);
    musicNext = 0;
    scheduleBar();
    musicTimer = setInterval(scheduleBar, BASS.length * STEP * 1000);
};

const stopMusic = () => {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (musicBus) {
        const bus = musicBus;
        bus.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05); // redam, jangan putus mendadak
        setTimeout(() => bus.disconnect(), 500);
        musicBus = null;
    }
};

// Sebaran konfeti dihitung sekali saat modul dimuat — kalau di-random tiap
// render, posisinya loncat setiap kali komponen menggambar ulang.
const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
    emoji: ['🎉', '✨', '⭐', '🎊', '💥', '🏆'][i % 6],
    x: (Math.random() - 0.5) * 1000,
    y: (Math.random() - 0.5) * 760,
    rot: Math.random() * 720 - 360,
    dur: 0.9 + Math.random() * 0.7,
}));

// Layar game di proyektor: soal di atas, input jawaban di bawah.
// Siswa maju ke laptop guru, ketik jawaban (MathLive: ^ pangkat, sqrt akar), Enter.
// Benar → soal berikutnya. Waktu habis / guru skip → kunci tampil dulu.
export default function GamePlay({ game, questions }) {
    const hasTimer = game.timer_seconds > 0; // 0 = tanpa batas waktu
    const [idx, setIdx] = useState(0);
    // status: answering | correct | timeout (bahas dulu, kunci belum tampil) | revealed | finished
    const [status, setStatus] = useState(questions.length ? 'answering' : 'finished');
    const [timeLeft, setTimeLeft] = useState(game.timer_seconds);
    const [revealedKey, setRevealedKey] = useState('');
    const [wrong, setWrong] = useState(false); // jawaban terakhir salah -> border merah
    // Shake dijalankan lewat kontrol animasi, BUKAN dengan mengganti key React:
    // ganti key = subtree dibongkar-pasang, math-field ikut dibuat ulang, fokus
    // hilang dan listener yang terpasang saat mount ikut mati.
    const shake = useAnimationControls();
    const flash = useAnimationControls(); // kilat merah layar penuh saat salah
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
            ensureCtx();
            SFX[name]();
        } catch { /* audio bukan fitur kritis */ }
    };

    const question = questions[idx];

    // Timer per soal — jalan hanya saat menjawab & tidak dijeda; 5 detik terakhir bunyi tick
    useEffect(() => {
        if (!hasTimer || status !== 'answering' || paused) return;
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
        // Enter didengar di document, bukan di kolom jawaban: kalau listener
        // nempel di kolomnya, sekali guru klik Jeda/Layar Penuh/area kosong,
        // fokus lepas dan Enter mati sampai kolomnya diklik lagi.
        // Tombol dikecualikan supaya Enter tetap menekan tombol yang lagi fokus.
        const onKeyDown = (e) => {
            if (e.key !== 'Enter' || e.target?.tagName === 'BUTTON') return;
            e.preventDefault();
            submitRef.current();
        };
        const onInput = (e) => { if (e.inputType === 'insertLineBreak') submitRef.current(); };
        mf.addEventListener('change', onChange);
        document.addEventListener('keydown', onKeyDown);
        mf.addEventListener('input', onInput);
        mf.focus();
        return () => {
            mf.removeEventListener('change', onChange);
            document.removeEventListener('keydown', onKeyDown);
            mf.removeEventListener('input', onInput);
        };
    }, []);

    // Browser menahan AudioContext sampai ada interaksi user. Bangunkan sekali
    // pada sentuhan/ketikan pertama; loop musik menyusul jalan sendiri.
    useEffect(() => {
        const bangunkan = () => ensureCtx();
        document.addEventListener('pointerdown', bangunkan, { once: true });
        document.addEventListener('keydown', bangunkan, { once: true });
        return () => {
            document.removeEventListener('pointerdown', bangunkan);
            document.removeEventListener('keydown', bangunkan);
        };
    }, []);

    // Musik latar hanya saat menunggu jawaban — berhenti begitu soal dijawab,
    // waktu habis, dijeda, atau suara dimatikan, supaya tidak menabrak SFX.
    useEffect(() => {
        if (!muted && status === 'answering' && !paused) startMusic();
        else stopMusic();
        return stopMusic;
    }, [muted, status, paused]);

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
                setWrong(true);
                shake.start({
                    x: [0, -26, 26, -18, 18, -8, 8, 0],
                    rotate: [0, -1.5, 1.5, -1, 1, 0],
                    transition: { duration: 0.55 },
                });
                flash.start({ opacity: [0, 0.5, 0], transition: { duration: 0.5 } });
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
        setWrong(false);
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
        setWrong(false);
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

            {/* Kilat merah saat salah. Selalu ter-mount & tembus klik supaya siswa
                bisa langsung mengetik ulang tanpa menunggu animasi selesai. */}
            <motion.div
                animate={flash}
                initial={{ opacity: 0 }}
                className="pointer-events-none fixed inset-0 z-[60] bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.35),rgba(190,18,60,0.9))]"
            />

            {/* Bar atas: nama game, progress, timer */}
            <div className="relative flex items-center justify-between px-6 sm:px-10 py-4 border-b border-slate-800/80">
                <div className="min-w-0">
                    <p className="font-extrabold tracking-tight truncate">{game.name}</p>
                    <p className="text-xs font-bold text-slate-500">Soal {Math.min(idx + 1, questions.length)} / {questions.length}</p>
                </div>
                {hasTimer && status !== 'finished' && (
                    <div className={`font-mono text-4xl sm:text-5xl font-extrabold tabular-nums ${timerColor}`}>
                        {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                )}
                <div className="flex items-center gap-4">
                    {hasTimer && status === 'answering' && (
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
                            <p className="font-extrabold text-amber-300">{hasTimer ? '⏱ Waktu habis — bahas dulu cara mengerjakannya' : '⏭ Dilewati — bahas dulu cara mengerjakannya'}</p>
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
                    <motion.div animate={shake} className={status === 'timeout' ? 'hidden' : ''}>
                        <div className={`rounded-2xl p-[2px] transition-colors ${wrong ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'}`}>
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
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-emerald-600/90 backdrop-blur-sm">
                        {/* Semburan konfeti — emoji biasa, tanpa library partikel */}
                        {CONFETTI.map((c, i) => (
                            <motion.span key={i} className="absolute text-4xl sm:text-5xl select-none"
                                initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                                animate={{ x: c.x, y: c.y, rotate: c.rot, scale: 1.3, opacity: 0 }}
                                transition={{ duration: c.dur, ease: 'easeOut' }}>
                                {c.emoji}
                            </motion.span>
                        ))}
                        <motion.div
                            initial={{ scale: 0.3, rotate: -12 }}
                            animate={{ scale: [0.3, 1.25, 1], rotate: [-12, 6, 0] }}
                            transition={{ duration: 0.6, times: [0, 0.55, 1], ease: 'easeOut' }}
                            className="relative text-center">
                            <motion.p className="text-8xl sm:text-9xl"
                                animate={{ y: [0, -18, 0], scale: [1, 1.15, 1] }}
                                transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}>
                                🎉
                            </motion.p>
                            <motion.p className="mt-4 text-6xl sm:text-8xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
                                animate={{ scale: [1, 1.06, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}>
                                BENAR!
                            </motion.p>
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
