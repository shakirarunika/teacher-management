import { useRef, useState } from 'react';
import axios from 'axios';

// Ekstrak ID video dari berbagai bentuk link YouTube (watch, youtu.be, shorts, embed)
export const ytId = (url) =>
    String(url ?? '').match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1];

// Render media soal — dipakai halaman siswa & preview builder guru.
export function MediaView({ media, className = '' }) {
    if (!media?.url) return null;

    if (media.type === 'image') {
        return <img src={media.url} alt="Gambar soal" className={`rounded-xl max-h-64 max-w-full ${className}`} />;
    }
    if (media.type === 'audio') {
        return <audio controls src={media.url} className={`w-full ${className}`} />;
    }
    if (media.type === 'youtube') {
        const id = ytId(media.url);
        if (!id) return null;
        return (
            <div className={`aspect-video ${className}`}>
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title="Video soal"
                    className="w-full h-full rounded-xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }
    return null;
}

const MEDIA_LABEL = { image: '🖼 Gambar', audio: '🎧 Audio', youtube: '▶ YouTube' };

// Editor lampiran soal: wacana/stimulus + satu media (gambar/audio/YouTube).
// q = objek soal {stimulus, media, ...}; onChange menerima patch parsial.
export default function QuestionExtras({ q, onChange }) {
    const [showStimulus, setShowStimulus] = useState(false);
    const [uploading, setUploading] = useState(false);
    const imgRef = useRef(null);
    const audioRef = useRef(null);

    const upload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const { data } = await axios.post(route('quiz-media.upload'), fd);
            onChange({ media: { type: data.type, url: data.url } });
        } catch (e) {
            alert(e.response?.data?.message ?? 'Upload gagal. Cek ukuran & format file.');
        } finally {
            setUploading(false);
        }
    };

    const askYoutube = () => {
        const url = window.prompt('Tempel link YouTube:');
        if (!url) return;
        if (!ytId(url)) { alert('Link YouTube tidak dikenali. Contoh: https://youtu.be/xxxx'); return; }
        onChange({ media: { type: 'youtube', url } });
    };

    const btn = 'px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 font-bold text-xs transition disabled:opacity-50';
    const hasStimulus = showStimulus || !!q.stimulus;

    return (
        <div className="mt-2">
            <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} />
            <input ref={audioRef} type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/aac,.mp3,.m4a" className="hidden" onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} />

            <div className="flex items-center gap-1.5 flex-wrap">
                {!hasStimulus && (
                    <button type="button" onClick={() => setShowStimulus(true)} className={btn}>+ Wacana</button>
                )}
                {!q.media && (
                    <>
                        <button type="button" disabled={uploading} onClick={() => imgRef.current?.click()} className={btn}>🖼 Gambar</button>
                        <button type="button" disabled={uploading} onClick={() => audioRef.current?.click()} className={btn}>🎧 Audio</button>
                        <button type="button" disabled={uploading} onClick={askYoutube} className={btn}>▶ YouTube</button>
                    </>
                )}
                {uploading && <span className="text-xs font-bold text-indigo-500 animate-pulse">Mengunggah…</span>}
            </div>

            {hasStimulus && (
                <div className="mt-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Wacana / teks bacaan (opsional)</label>
                        <button type="button" onClick={() => { setShowStimulus(false); onChange({ stimulus: '' }); }}
                            className="text-xs font-bold text-gray-400 hover:text-rose-500 transition">Hapus wacana</button>
                    </div>
                    <textarea value={q.stimulus ?? ''} onChange={(e) => onChange({ stimulus: e.target.value })} rows={3}
                        placeholder="Teks bacaan/dialog yang jadi acuan soal..."
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
            )}

            {q.media && (
                <div className="mt-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400">{MEDIA_LABEL[q.media.type]}</span>
                        <button type="button" onClick={() => onChange({ media: null })}
                            className="text-xs font-bold text-gray-400 hover:text-rose-500 transition">Hapus media</button>
                    </div>
                    <MediaView media={q.media} />
                </div>
            )}
        </div>
    );
}
