import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// ── Animated background orbs ──────────────────────────────────────────────────
function BackgroundOrbs({ colors }) {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Orb 1 – indigo top-left */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-10%',
                width: '500px', height: '500px',
                background: `radial-gradient(circle, ${colors.orb1} 0%, transparent 70%)`,
                borderRadius: '50%',
                animation: 'orbFloat1 8s ease-in-out infinite',
            }} />
            {/* Orb 2 – purple top-right */}
            <div style={{
                position: 'absolute', top: '-5%', right: '-5%',
                width: '400px', height: '400px',
                background: `radial-gradient(circle, ${colors.orb2} 0%, transparent 70%)`,
                borderRadius: '50%',
                animation: 'orbFloat2 10s ease-in-out infinite',
            }} />
            {/* Orb 3 – sky bottom-center */}
            <div style={{
                position: 'absolute', bottom: '-5%', left: '50%',
                transform: 'translateX(-50%)',
                width: '350px', height: '350px',
                background: `radial-gradient(circle, ${colors.orb3} 0%, transparent 70%)`,
                borderRadius: '50%',
                animation: 'orbFloat3 12s ease-in-out infinite',
            }} />

            <style>{`
                @keyframes orbFloat1 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50% { transform: translate(30px, 20px) scale(1.08); }
                }
                @keyframes orbFloat2 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50% { transform: translate(-20px, 30px) scale(1.1); }
                }
                @keyframes orbFloat3 {
                    0%,100% { transform: translateX(-50%) scale(1); }
                    50% { transform: translateX(-50%) scale(1.15); }
                }
                @keyframes iconFloat {
                    0%,100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function Field({ id, label, type = 'text', value, onChange, autoComplete, isFocused, error, icon, theme = 'light' }) {
    const [focused, setFocused] = useState(false);
    const isDark = theme === 'dark';

    return (
        <div>
            <label
                htmlFor={id}
                style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: focused ? '#818cf8' : (isDark ? '#94a3b8' : '#64748b'),
                    marginBottom: '0.4rem',
                    transition: 'color 0.2s',
                }}
            >
                {label}
            </label>

            <div style={{ position: 'relative' }}>
                {/* Left icon */}
                <div style={{
                    position: 'absolute', left: '1rem', top: '50%',
                    transform: 'translateY(-50%)',
                    color: focused ? '#818cf8' : (isDark ? '#475569' : '#94a3b8'),
                    transition: 'color 0.2s',
                    pointerEvents: 'none',
                }}>
                    {icon}
                </div>

                <input
                    id={id}
                    type={type}
                    name={id}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    autoFocus={isFocused}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        width: '100%',
                        paddingLeft: '2.75rem',
                        paddingRight: '1rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        background: focused 
                            ? (isDark ? '#1a1d2e' : '#ffffff') 
                            : (isDark ? '#13151f' : '#f1f5f9'),
                        border: `1.5px solid ${focused 
                            ? 'rgba(99,102,241,0.6)' 
                            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                        borderRadius: '0.875rem',
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                    }}
                />
            </div>

            {error && (
                <p style={{
                    marginTop: '0.4rem',
                    fontSize: '0.78rem',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}

// ── Main Login Page ───────────────────────────────────────────────────────────
export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPass, setShowPass] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

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

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const isDark = theme === 'dark';

    // Theme palette
    const colors = {
        bg: isDark ? '#0d0f18' : '#f8fafc',
        cardBg: isDark ? 'rgba(22, 25, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        cardBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        cardShadow: isDark 
            ? '0 0 0 1px rgba(99,102,241,0.08), 0 40px 80px -20px rgba(0,0,0,0.7)' 
            : '0 0 0 1px rgba(99,102,241,0.03), 0 20px 40px 20px rgba(99,102,241,0.04)',
        textPrimary: isDark ? '#f1f5f9' : '#0f172a',
        textSecondary: isDark ? '#94a3b8' : '#475569',
        textMuted: isDark ? '#475569' : '#94a3b8',
        divider: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        dividerText: isDark ? '#334155' : '#94a3b8',
        forgotText: isDark ? '#818cf8' : '#6366f1',
        forgotHover: isDark ? '#a5b4fc' : '#4f46e5',
        footerHelpText: isDark ? '#475569' : '#64748b',
        titleGrad: isDark 
            ? 'linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #c084fc 100%)' 
            : 'linear-gradient(135deg, #0f172a 0%, #312e81 50%, #4c1d95 100%)',
        orb1: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.06)',
        orb2: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.05)',
        orb3: isDark ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.04)',
    };

    return (
        <>
            <Head title="Masuk — SINTESIS" />

            {/* ── Page wrapper ── */}
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: colors.bg,
                fontFamily: "'Outfit', 'Inter', sans-serif",
                padding: '1.5rem',
                position: 'relative',
                transition: 'background 0.3s ease',
            }}>
                <BackgroundOrbs colors={colors} />

                {/* Kembali ke Beranda (Floating top-left) */}
                <div style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', zIndex: 100 }}>
                    <Link
                        href="/"
                        style={{
                            height: '40px',
                            padding: '0 1.1rem',
                            borderRadius: '0.875rem',
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                            boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            color: colors.textSecondary,
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)'; e.currentTarget.style.color = isDark ? '#f1f5f9' : '#0f172a'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'; e.currentTarget.style.color = colors.textSecondary; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                        </svg>
                        Kembali
                    </Link>
                </div>

                {/* Theme Switcher Toggle (Floating top-right) */}
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '0.875rem',
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                            boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: colors.textPrimary,
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.2s',
                        }}
                        title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'; }}
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
                </div>

                {/* ── Card ── */}
                <div style={{
                    width: '100%',
                    maxWidth: '420px',
                    background: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '1.75rem',
                    boxShadow: colors.cardShadow,
                    padding: '2.5rem 2rem',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    zIndex: 10,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease, background 0.3s, border 0.3s, box-shadow 0.3s',
                }}>

                    {/* ── Icon + Branding ── */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        {/* Floating icon */}
                        <div style={{
                            width: '72px', height: '72px',
                            borderRadius: '1.5rem',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem',
                            boxShadow: '0 0 0 8px rgba(99,102,241,0.12), 0 20px 40px rgba(99,102,241,0.3)',
                            animation: 'iconFloat 4s ease-in-out infinite',
                        }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h1 className="sintesis-text-gradient" style={{
                            fontSize: '1.85rem',
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                            margin: 0,
                            lineHeight: 1.1,
                        }}>
                            SINTESIS
                        </h1>
                        <p style={{
                            fontSize: '0.8rem',
                            color: colors.textSecondary,
                            fontWeight: 500,
                            marginTop: '0.3rem',
                            letterSpacing: '0.02em',
                            transition: 'color 0.3s',
                        }}>
                            Sistem Integrasi Tenaga Edukasi & Sekolah
                        </p>

                        {/* Divider */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            margin: '1.25rem auto 0',
                            maxWidth: '260px',
                        }}>
                            <div style={{ flex: 1, height: '1px', background: colors.divider, transition: 'background 0.3s' }} />
                            <span style={{
                                fontSize: '0.65rem', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.12em',
                                color: colors.dividerText, whiteSpace: 'nowrap',
                                transition: 'color 0.3s',
                            }}>
                                Portal Guru
                            </span>
                            <div style={{ flex: 1, height: '1px', background: colors.divider, transition: 'background 0.3s' }} />
                        </div>
                    </div>

                    {/* ── Status message ── */}
                    {status && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: '0.75rem',
                            color: '#34d399',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                        }}>
                            {status}
                        </div>
                    )}

                    {/* ── Form ── */}
                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                        {/* Email */}
                        <Field
                            id="email"
                            label="Email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="username"
                            isFocused={true}
                            error={errors.email}
                            theme={theme}
                            icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                </svg>
                            }
                        />

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                style={{
                                    display: 'block',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    color: isDark ? '#94a3b8' : '#64748b',
                                    marginBottom: '0.4rem',
                                    transition: 'color 0.2s',
                                }}
                            >
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                {/* Lock icon */}
                                <div style={{
                                    position: 'absolute', left: '1rem', top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: isDark ? '#475569' : '#94a3b8', pointerEvents: 'none',
                                    transition: 'color 0.2s',
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </div>

                                <input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    autoComplete="current-password"
                                    style={{
                                        width: '100%',
                                        paddingLeft: '2.75rem',
                                        paddingRight: '3rem',
                                        paddingTop: '0.75rem',
                                        paddingBottom: '0.75rem',
                                        background: isDark ? '#13151f' : '#f1f5f9',
                                        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                        borderRadius: '0.875rem',
                                        color: isDark ? '#f1f5f9' : '#0f172a',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'rgba(99,102,241,0.6)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                                        e.target.style.background = isDark ? '#1a1d2e' : '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.background = isDark ? '#13151f' : '#f1f5f9';
                                    }}
                                />

                                {/* Toggle show/hide password */}
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute', right: '1rem', top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        color: isDark ? '#475569' : '#94a3b8', cursor: 'pointer',
                                        padding: '0.2rem', lineHeight: 0,
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#818cf8'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? '#475569' : '#94a3b8'}
                                    aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPass ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember me + Forgot password */}
                        <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    style={{ accentColor: '#6366f1', width: '14px', height: '14px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.82rem', color: colors.textSecondary, fontWeight: 500, transition: 'color 0.3s' }}>
                                    Ingat saya
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    style={{
                                        fontSize: '0.82rem',
                                        color: colors.forgotText,
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = colors.forgotHover}
                                    onMouseLeave={(e) => e.currentTarget.style.color = colors.forgotText}
                                >
                                    Lupa password?
                                </Link>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                marginTop: '0.5rem',
                                background: processing
                                    ? 'rgba(99,102,241,0.5)'
                                    : 'linear-gradient(135deg, #6366f1, #a855f7)',
                                border: 'none',
                                borderRadius: '0.875rem',
                                color: '#fff',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                boxShadow: processing ? 'none' : '0 8px 24px rgba(99,102,241,0.35)',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                            }}
                            onMouseEnter={(e) => {
                                if (!processing) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 14px 32px rgba(99,102,241,0.45)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.35)';
                            }}
                        >
                            {processing ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    </svg>
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                        <polyline points="10 17 15 12 10 7"/>
                                        <line x1="15" y1="12" x2="3" y2="12"/>
                                    </svg>
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>

                    {/* ── Footer ── */}
                    <div style={{
                        marginTop: '1.75rem',
                        paddingTop: '1.25rem',
                        borderTop: `1px solid ${colors.divider}`,
                        textAlign: 'center',
                        display: 'flex', flexDirection: 'column', gap: '0.35rem',
                        transition: 'border-color 0.3s',
                    }}>
                        <p style={{ fontSize: '0.75rem', color: colors.footerHelpText, margin: 0, transition: 'color 0.3s' }}>
                            Akses khusus untuk guru terdaftar
                        </p>
                        <p style={{ fontSize: '0.72rem', color: colors.textSecondary, margin: 0, transition: 'color 0.3s' }}>
                            Made with{' '}
                            <span style={{ color: '#f43f5e' }}>❤️</span>
                            {' '}by{' '}
                            <span style={{ color: isDark ? '#818cf8' : '#4f46e5', fontWeight: 700 }}>Faishal</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
