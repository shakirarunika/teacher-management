import katex from 'katex';
import 'katex/dist/katex.min.css';

// Render teks yang mengandung rumus LaTeX di antara $...$ pakai KaTeX.
// Contoh: "Hitung $\frac{1}{2} + \frac{1}{4}$" — teks biasa tetap plain.
export default function MathText({ text }) {
    const s = String(text ?? '');
    if (!s.includes('$')) return s;
    return s.split(/(\$[^$]+\$)/g).map((part, i) =>
        part.length > 2 && part.startsWith('$') && part.endsWith('$') ? (
            <span key={i} dangerouslySetInnerHTML={{
                __html: katex.renderToString(part.slice(1, -1), { throwOnError: false }),
            }} />
        ) : (
            part
        )
    );
}

// True kalau soal (q + options) mengandung rumus — untuk munculkan preview di builder
export const hasMath = (q, options = []) => q.includes('$') || options.some((o) => o.includes('$'));
