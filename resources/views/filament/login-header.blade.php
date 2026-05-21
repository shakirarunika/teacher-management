<a href="/" class="siguru-back-btn">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
    Kembali
</a>

<button id="siguru-theme-toggle" class="siguru-theme-toggle" title="Ubah Tema">
    <!-- Sun icon -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-sun">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
    <!-- Moon icon -->
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-moon">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
</button>

<div class="siguru-login-hero">
    {{-- Animated gradient orbs background --}}
    <div class="siguru-orb siguru-orb-1"></div>
    <div class="siguru-orb siguru-orb-2"></div>
    <div class="siguru-orb siguru-orb-3"></div>

    {{-- Icon & Branding --}}
    <div class="siguru-brand">
        <div class="siguru-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="siguru-icon">
                <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <h1 class="siguru-title">SINTESIS</h1>
        <p class="siguru-subtitle">Sistem Integrasi Tenaga Edukasi & Sekolah</p>
        <div class="siguru-divider">
            <span></span>
            <span class="siguru-divider-label">Admin Panel</span>
            <span></span>
        </div>
    </div>
</div>

<style>
.siguru-theme-toggle {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 100;
    width: 40px;
    height: 40px;
    border-radius: 0.875rem;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #475569;
    backdrop-filter: blur(8px);
    transition: all 0.2s;
}
.siguru-theme-toggle:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.95);
    color: #0f172a;
}
.dark .siguru-theme-toggle {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;
    color: #94a3b8;
}
.dark .siguru-theme-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
}
.siguru-theme-toggle .theme-icon-sun {
    display: none;
}
.siguru-theme-toggle .theme-icon-moon {
    display: block;
}
.dark .siguru-theme-toggle .theme-icon-sun {
    display: block;
}
.dark .siguru-theme-toggle .theme-icon-moon {
    display: none;
}

.siguru-back-btn {
    position: fixed;
    top: 1.5rem;
    left: 1.5rem;
    z-index: 100;
    height: 40px;
    padding: 0 1.1rem;
    border-radius: 0.875rem;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: #475569;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
    backdrop-filter: blur(8px);
    transition: all 0.2s;
}
.siguru-back-btn:hover {
    transform: scale(1.03);
    background: rgba(255, 255, 255, 0.95);
    color: #0f172a;
}
.dark .siguru-back-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;
    color: #94a3b8;
}
.dark .siguru-back-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
}

/* =============================================
   LOGIN HERO BLOCK
   ============================================= */
.siguru-login-hero {
    position: relative;
    text-align: center;
    padding: 2.5rem 1.5rem 1rem;
    overflow: hidden;
}

/* Animated gradient orbs */
.siguru-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.15;
    animation: orbPulse 6s ease-in-out infinite;
}
.dark .siguru-orb {
    opacity: 0.25;
}
.siguru-orb-1 {
    width: 200px; height: 200px;
    background: #6366f1;
    top: -60px; left: -60px;
    animation-delay: 0s;
}
.siguru-orb-2 {
    width: 160px; height: 160px;
    background: #a855f7;
    top: -40px; right: -40px;
    animation-delay: 2s;
}
.siguru-orb-3 {
    width: 120px; height: 120px;
    background: #0ea5e9;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    animation-delay: 4s;
}

@keyframes orbPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
}
.siguru-orb-3 {
    animation-name: orbPulse3;
}
@keyframes orbPulse3 {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.2); }
}

/* Brand container */
.siguru-brand {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

/* Icon wrap with glow ring */
.siguru-icon-wrap {
    width: 72px;
    height: 72px;
    border-radius: 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
        0 0 0 6px rgba(99, 102, 241, 0.15),
        0 0 0 12px rgba(99, 102, 241, 0.07),
        0 20px 40px rgba(99, 102, 241, 0.25);
    animation: iconFloat 4s ease-in-out infinite;
    margin-bottom: 0.5rem;
}

@keyframes iconFloat {
    0%, 100% { transform: translateY(0px); box-shadow: 0 0 0 6px rgba(99,102,241,.15), 0 0 0 12px rgba(99,102,241,.07), 0 20px 40px rgba(99,102,241,.25); }
    50% { transform: translateY(-6px); box-shadow: 0 0 0 6px rgba(99,102,241,.2), 0 0 0 12px rgba(99,102,241,.1), 0 30px 50px rgba(99,102,241,.3); }
}

.siguru-icon {
    width: 36px;
    height: 36px;
    color: #ffffff;
}

/* Title - Gradient */
.siguru-title {
    font-size: 2rem;
    font-weight: 900;
    letter-spacing: -0.04em;
    background-image: linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #7c3aed 100%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    color: transparent !important;
    transition: none !important;
    margin: 0;
    line-height: 1;
    display: inline-block;
    padding-right: 0.15em !important;
}
.dark .siguru-title {
    background-image: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 50%, #c084fc 100%) !important;
}

/* Subtitle */
.siguru-subtitle {
    font-size: 0.8rem;
    color: #475569;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin: 0;
}
.dark .siguru-subtitle {
    color: #94a3b8;
}

/* Divider */
.siguru-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
    width: 100%;
    max-width: 240px;
}
.siguru-divider span:not(.siguru-divider-label) {
    flex: 1;
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
}
.dark .siguru-divider span:not(.siguru-divider-label) {
    background: rgba(255, 255, 255, 0.08);
}
.siguru-divider-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #64748b;
    white-space: nowrap;
}
.dark .siguru-divider-label {
    color: #475569;
}

/* =============================================
   IMPROVE LOGIN FORM CARD (via CSS)
   ============================================= */

/* The login card/form wrapper */
.fi-simple-main {
    background-color: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 1.5rem !important;
    box-shadow:
        0 0 0 1px rgba(99, 102, 241, 0.05),
        0 20px 40px -10px rgba(0, 0, 0, 0.08) !important;
    overflow: hidden;
    padding: 0 !important;
}
.dark .fi-simple-main {
    background-color: #1a1d27 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow:
        0 0 0 1px rgba(99, 102, 241, 0.1),
        0 40px 80px -20px rgba(0, 0, 0, 0.6) !important;
}

/* Hide default Filament logo/brand on login (we have our own) */
.fi-simple-header {
    display: none !important;
}

/* Form padding */
.fi-simple-page-content {
    padding: 2rem !important;
}

/* Login form heading (if any) */
.fi-simple-page .fi-simple-header-heading {
    display: none;
}

/* Make the "Sign in" submit button full width and gradient */
.fi-simple-page .fi-btn-color-primary {
    width: 100% !important;
    justify-content: center !important;
    padding: 0.75rem 1.5rem !important;
    font-size: 1rem !important;
    letter-spacing: 0.02em !important;
    background: linear-gradient(135deg, #6366f1, #a855f7) !important;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3) !important;
}

.fi-simple-page .fi-btn-color-primary:hover {
    background: linear-gradient(135deg, #4f46e5, #9333ea) !important;
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4) !important;
    transform: translateY(-1px) !important;
}

/* Input fields on login */
.fi-simple-page .fi-input-wrapper,
.fi-simple-page .fi-input {
    background-color: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
}
.dark .fi-simple-page .fi-input-wrapper,
.dark .fi-simple-page .fi-input {
    background-color: #0f1117 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #f1f5f9 !important;
}

.fi-simple-page .fi-input-wrapper:focus-within {
    border-color: rgba(99, 102, 241, 0.6) !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
}

/* Labels on login fields */
.fi-simple-page .fi-fo-field-wrp-label label,
.fi-simple-page .fi-fo-field-wrp-label .fi-fo-field-wrp-label-text {
    color: #334155 !important;
}
.dark .fi-simple-page .fi-fo-field-wrp-label label,
.dark .fi-simple-page .fi-fo-field-wrp-label .fi-fo-field-wrp-label-text {
    color: #cbd5e1 !important;
}

/* Overall simple page background */
.fi-simple-main-ctn {
    background: transparent !important;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.fi-simple-layout {
    background: #f8fafc !important;
    background-image:
        radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 50%) !important;
    min-height: 100vh;
}
.dark .fi-simple-layout {
    background: #0f1117 !important;
    background-image:
        radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.10) 0%, transparent 50%) !important;
}
</style>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        const toggleBtn = document.getElementById('siguru-theme-toggle');
        
        // Initial setup based on localStorage or document state
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            // Check browser preference if no localStorage set
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            }
        }

        toggleBtn.addEventListener('click', function () {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                window.dispatchEvent(new CustomEvent('theme-changed', { detail: 'light' }));
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                window.dispatchEvent(new CustomEvent('theme-changed', { detail: 'dark' }));
            }
        });
    });
</script>
