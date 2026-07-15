import { useEffect, useRef } from 'react';
import Modal from '@/Components/Modal';
import { MathfieldElement } from 'mathlive';
import 'mathlive/fonts.css';

// Font di-bundle Vite lewat fonts.css; sounds tidak dipakai.
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

// Editor rumus visual (MathLive): virtual keyboard + menu sisip bawaan library.
// Hasilnya LaTeX, disisipkan ke field pemanggil sebagai $...$ (dirender MathText/KaTeX).
export default function MathModal({ show, onClose, onInsert }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!show) return;
        const t = setTimeout(() => ref.current?.focus(), 250); // tunggu animasi modal
        return () => clearTimeout(t);
    }, [show]);

    const insert = () => {
        const latex = ref.current?.value?.trim();
        if (latex) onInsert(`$${latex}$`);
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Σ Sisipkan Rumus Matematika</h2>

                <math-field
                    ref={ref}
                    class="mt-4 block w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-xl shadow-sm"
                />

                <div className="mt-3 text-xs text-gray-400 dark:text-slate-500 space-y-0.5">
                    <p>Tips: pakai virtual keyboard (ikon keyboard) atau ketik langsung:</p>
                    <p><code className="font-mono">^</code> untuk pangkat (contoh: x^2) · <code className="font-mono">/</code> untuk pecahan (contoh: 1/2)</p>
                    <p><code className="font-mono">sqrt</code> untuk akar kuadrat · <code className="font-mono">pi</code> untuk π</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-gray-700 dark:text-slate-200 transition">Batal</button>
                    <button type="button" onClick={insert} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-md shadow-indigo-500/30 transition">✓ Sisipkan Rumus</button>
                </div>
            </div>
        </Modal>
    );
}
