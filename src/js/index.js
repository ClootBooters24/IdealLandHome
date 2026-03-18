// Update the copyright year dynamically
const yearEl = document.getElementById('copyright-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mark the active nav link based on current page
const normalizePath = path => {
    if (!path) return '/';
    const withoutHtml = path.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
    const trimmed = withoutHtml.replace(/\/$/, '');
    return trimmed || '/';
};

const currentPath = normalizePath(window.location.pathname);
document.querySelectorAll('.main-nav a').forEach(link => {
    const linkPath = normalizePath(new URL(link.getAttribute('href'), window.location.origin).pathname);
    const isActive = linkPath === currentPath;
    link.classList.toggle('active', isActive);
    if (isActive) {
        link.setAttribute('aria-current', 'page');
    } else {
        link.removeAttribute('aria-current');
    }
});

// Mobile navigation toggle
const toggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.main-nav');

if (toggle && nav) {
    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('active');
        toggle.classList.toggle('active', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
    });

    // Close nav when a link is clicked
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('nav-open');
        });
    });

    // Close nav when clicking the overlay
    document.addEventListener('click', e => {
        if (nav.classList.contains('active') && !nav.contains(e.target) && !toggle.contains(e.target)) {
            nav.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('nav-open');
        }
    });
}