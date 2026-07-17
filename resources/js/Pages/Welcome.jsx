import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// ── Shared footer component ───────────────────────────────────────────────────
export function MadeWithLove({ theme = 'light' }) {
    const isDark = theme === 'dark';
    return (
        <div style={{
            textAlign: 'center',
            fontSize: '0.72rem',
            color: isDark ? '#94a3b8' : '#475569',
            letterSpacing: '0.02em',
            transition: 'color 0.3s ease',
        }}>
            Made with{' '}
            <span style={{ color: '#f43f5e', fontSize: '0.85rem' }}>❤️</span>
            {' '}by{' '}
            <span style={{ color: isDark ? '#818cf8' : '#4f46e5', fontWeight: 700 }}>Zahra</span>
        </div>
    );
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay, theme = 'light' }) {
    const isDark = theme === 'dark';
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(99,102,241,0.08)',
            boxShadow: isDark ? 'none' : '0 10px 30px -10px rgba(99,102,241,0.05)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.3s, border 0.3s, box-shadow 0.3s',
        }}>
            <div style={{
                width: '44px', height: '44px',
                borderRadius: '0.875rem',
                background: isDark ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))' : 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.95rem', marginBottom: '0.25rem', transition: 'color 0.3s' }}>
                    {title}
                </div>
                <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.6, transition: 'color 0.3s' }}>
                    {desc}
                </div>
            </div>
        </div>
    );
}

// ── Main Welcome Page ─────────────────────────────────────────────────────────
export default function Welcome({ auth }) {
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        // Smart redirect: kalau sudah login → dashboard
        if (auth?.user) {
            router.visit(route('dashboard'));
            return;
        }
        const t = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(t);
    }, [auth]);

    useEffect(() => {
        // Apply theme to document element
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Jangan render kalau user sudah login (akan redirect)
    if (auth?.user) return null;

    const isDark = theme === 'dark';

    // Theme palette
    const colors = {
        bg: isDark ? '#0d0f18' : '#f8fafc',
        textPrimary: isDark ? '#f1f5f9' : '#0f172a',
        textSecondary: isDark ? '#94a3b8' : '#475569',
        textMuted: isDark ? '#475569' : '#94a3b8',
        navBg: isDark ? 'rgba(13, 15, 24, 0.8)' : 'rgba(248, 250, 252, 0.8)',
        navBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        heroTitle: isDark
            ? 'linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #c084fc 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #312e81 50%, #4c1d95 100%)',
        divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        featureDividerText: isDark ? '#334155' : '#64748b',
        btnAdminBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        btnAdminBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        btnAdminText: isDark ? '#94a3b8' : '#475569',
        btnAdminHoverBg: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
        btnAdminHoverBorder: isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)',
        orb1: isDark ? 'rgba(99,102,241,0.14)' : 'rgba(99,102,241,0.05)',
        orb2: isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.04)',
        orb3: isDark ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.03)',
    };

    const features = [
        { icon: '📋', title: 'Absensi Digital', desc: 'Rekam kehadiran siswa per kelas dengan cepat dan akurat setiap hari.' },
        { icon: '🧩', title: 'Kuis Online', desc: 'Buat kuis pilihan ganda, isian singkat & menjodohkan. Bagikan lewat link/QR, dinilai otomatis.' },
        { icon: '🗃️', title: 'Bank Soal', desc: 'Simpan soal sekali, pakai ulang di kuis mana pun. Mendukung rumus matematika, gambar & audio.' },
        { icon: '📊', title: 'Nilai & Rapor', desc: 'Input nilai tugas, PTS, dan PAS. Hitung nilai akhir otomatis berdasarkan bobot, salin skor kuis sekali klik.' },
        { icon: '📈', title: 'Laporan Kehadiran', desc: 'Lihat rekap absensi per siswa lengkap dengan status hadir, izin, sakit, alpha.' },
        { icon: '🏫', title: 'Manajemen Kelas', desc: 'Kelola data kelas, siswa, mata pelajaran dalam satu sistem terintegrasi.' },
    ];

    return (
        <>
            <Head title="Sistem Integrasi Tenaga Edukasi &amp; Sekolah" />

            <div style={{
                minHeight: '100vh',
                background: colors.bg,
                fontFamily: "'Outfit', 'Inter', sans-serif",
                color: colors.textPrimary,
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.3s ease, color 0.3s ease',
            }}>
                {/* ── Background orbs ── */}
                <div aria-hidden="true">
                    <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: '600px', height: '600px', background: `radial-gradient(circle, ${colors.orb1} 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'f1 10s ease-in-out infinite' }} />
                    <div style={{ position: 'fixed', top: '10%', right: '-10%', width: '500px', height: '500px', background: `radial-gradient(circle, ${colors.orb2} 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'f2 12s ease-in-out infinite' }} />
                    <div style={{ position: 'fixed', bottom: '-10%', left: '30%', width: '400px', height: '400px', background: `radial-gradient(circle, ${colors.orb3} 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'f3 14s ease-in-out infinite' }} />
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;900&display=swap');
                        @keyframes f1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,30px)} }
                        @keyframes f2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,40px)} }
                        @keyframes f3 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-40px)} }
                        @keyframes iconFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

                        @media (max-width: 640px) {
                            .sintesis-nav {
                                padding: 0.75rem 0.85rem !important;
                                gap: 0.5rem !important;
                            }
                            .sintesis-logo-nav {
                                display: none !important;
                            }
                            .sintesis-nav-right {
                                gap: 0.4rem !important;
                                width: auto !important;
                            }
                            .sintesis-btn-admin, .sintesis-btn-login {
                                font-size: 0.72rem !important;
                                padding: 0.35rem 0.65rem !important;
                            }
                        }
                    `}</style>
                </div>

                {/* ── Navbar ── */}
                <nav className="sintesis-nav" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.25rem 2rem',
                    borderBottom: `1px solid ${colors.navBorder}`,
                    backdropFilter: 'blur(12px)',
                    position: 'sticky', top: 0, zIndex: 50,
                    background: colors.navBg,
                    transition: 'background 0.3s ease, border-color 0.3s ease',
                }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '0.75rem',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <span className="sintesis-logo-nav" style={{
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            letterSpacing: '-0.03em',
                        }}>
                            SINTESIS
                        </span>
                    </div>

                    {/* Nav right */}
                    <div className="sintesis-nav-right" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Theme Switcher Toggle */}
                        <button
                            onClick={toggleTheme}
                            style={{
                                width: '36px', height: '36px',
                                borderRadius: '0.75rem',
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: colors.textPrimary,
                                transition: 'all 0.2s',
                            }}
                            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; }}
                        >
                            {isDark ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                                </svg>
                            )}
                        </button>

                        {/* Akses admin sengaja disamarkan jadi icon tanpa label */}
                        <a
                            href="/admin"
                            className="sintesis-btn-admin"
                            aria-label="Admin"
                            style={{
                                width: '36px', height: '36px',
                                borderRadius: '0.75rem',
                                border: `1px solid ${colors.btnAdminBorder}`,
                                background: colors.btnAdminBg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: colors.textSecondary,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = colors.btnAdminHoverBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = colors.textSecondary; e.currentTarget.style.borderColor = colors.btnAdminBorder; e.currentTarget.style.background = colors.btnAdminBg; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                            </svg>
                        </a>
                        <Link
                            href={route('login')}
                            className="sintesis-btn-login"
                            style={{
                                fontSize: '0.82rem', fontWeight: 700, color: '#fff',
                                textDecoration: 'none', padding: '0.4rem 1.1rem',
                                borderRadius: '0.625rem',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)'; }}
                        >
                            Masuk →
                        </Link>
                    </div>
                </nav>

                {/* ── Hero Section ── */}
                <section style={{
                    textAlign: 'center',
                    padding: '5rem 2rem 4rem',
                    maxWidth: '720px',
                    margin: '0 auto',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease, transform 0.6s ease',
                }}>
                    {/* Badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.35rem 0.9rem',
                        borderRadius: '9999px',
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        fontSize: '0.75rem', fontWeight: 700, color: '#6366f1',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        marginBottom: '1.75rem',
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', display: 'inline-block', boxShadow: '0 0 6px #6366f1' }} />
                        Sistem Informasi Sekolah
                    </div>

                    {/* Floating icon */}
                    <div style={{
                        width: '90px', height: '90px',
                        borderRadius: '1.75rem',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 2rem',
                        boxShadow: '0 0 0 10px rgba(99,102,241,0.1), 0 0 0 20px rgba(99,102,241,0.05), 0 24px 48px rgba(99,102,241,0.35)',
                        animation: 'iconFloat 4s ease-in-out infinite',
                    }}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="sintesis-text-gradient" style={{
                        fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        margin: '0 0 1rem',
                    }}>
                        SINTESIS
                    </h1>
                    <p style={{
                        fontSize: '1.05rem',
                        color: colors.textPrimary,
                        fontWeight: 650,
                        marginBottom: '0.5rem',
                        letterSpacing: '0.01em',
                        transition: 'color 0.3s',
                    }}>
                        Sistem Integrasi Tenaga Edukasi & Sekolah
                    </p>
                    <p style={{
                        fontSize: '0.95rem',
                        color: colors.textSecondary,
                        maxWidth: '600px',
                        margin: '0 auto 2.5rem',
                        lineHeight: 1.7,
                        fontWeight: 500,
                        transition: 'color 0.3s',
                    }}>
                        SINTESIS: Administrasi Tuntas, Edukasi Berkualitas. Platform digital sekolah terintegrasi untuk mengoptimalkan manajemen kehadiran, penilaian, kalender akademik, dan pelaporan secara efisien, transparan, dan real-time.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                            href={route('login')}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.875rem 2rem',
                                borderRadius: '0.875rem',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                textDecoration: 'none',
                                boxShadow: '0 10px 30px rgba(99,102,241,0.3)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(99,102,241,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.3)'; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                            Masuk sebagai Guru
                        </Link>
                    </div>
                </section>

                {/* ── Features Grid ── */}
                <section style={{
                    maxWidth: '900px', margin: '0 auto',
                    padding: '2rem 2rem 5rem',
                }}>
                    {/* Divider */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        marginBottom: '2.5rem',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: colors.divider }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.featureDividerText, transition: 'color 0.3s' }}>
                            Fitur Unggulan
                        </span>
                        <div style={{ flex: 1, height: '1px', background: colors.divider }} />
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '1rem',
                    }}>
                        {features.map((f, i) => (
                            <FeatureCard key={i} {...f} delay={200 + i * 80} theme={theme} />
                        ))}
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer style={{
                    borderTop: `1px solid ${colors.divider}`,
                    padding: '1.5rem 2rem',
                    textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                    transition: 'border-color 0.3s',
                }}>
                    <MadeWithLove theme={theme} />
                    <p style={{ fontSize: '0.7rem', color: colors.textSecondary, margin: 0, transition: 'color 0.3s' }}>
                        © {new Date().getFullYear()} SINTESIS · Sistem Integrasi Tenaga Edukasi & Sekolah
                    </p>
                </footer>
            </div>
        </>
    );
}
