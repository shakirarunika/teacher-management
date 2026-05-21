@if (filament()->auth()->check())
<footer class="siguru-footer">
    <div class="siguru-footer-content">
        <p>Made with <span class="heart">❤️</span> by <span class="author">Faishal</span></p>
    </div>
</footer>
@endif

<style>
.siguru-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: auto;
}
.siguru-footer p {
    color: #64748b;
    margin: 0;
}
.dark .siguru-footer p {
    color: #94a3b8;
}
.siguru-footer .heart {
    display: inline-block;
    animation: footerHeartPulse 1.2s infinite;
}
.siguru-footer .author {
    color: #4f46e5;
    font-weight: 700;
}
.dark .siguru-footer .author {
    color: #a5b4fc;
}

@keyframes footerHeartPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
}
</style>
