// Update the copyright year dynamically
const yearEl = document.getElementById('copyright-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mark the active nav link based on current page
const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
document.querySelectorAll('.main-nav a').forEach(link => {
    const href = link.getAttribute('href').replace(/\/$/, '');
    const isHome = (href === '/' || href === 'index.html') && (currentPath === '/' || currentPath === '');
    const isMatch = !isHome && href !== '/' && href !== 'index.html' && currentPath.endsWith(href.replace('.html', ''));
    if (isHome || isMatch) link.classList.add('active');
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