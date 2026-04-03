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

// Projects Carousel (only on pages with carousel)
if (!window.GALLERY_API) {
    window.GALLERY_API = '/api/gallery';
    window.MEDIA_BASE_URL = 'https://media.ideal-land-home.com';
}
const CAROUSEL_SLIDE_MS = 5000;

let carouselImages = [];
let currentCarouselIndex = 0;
let carouselIntervalId = null;
let carouselSwapTimeoutId = null;

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

function imageUrl(r2Key) {
    if (!r2Key) return '';
    if (/^https?:\/\//i.test(r2Key)) return r2Key;
    const cleanKey = String(r2Key).replace(/^\/+/, '');
    return `${window.MEDIA_BASE_URL}/${cleanKey}`;
}

function getItemImageKeys(item) {
    if (Array.isArray(item.images) && item.images.length > 0) {
        return item.images.filter(Boolean);
    }
    return item.r2Key ? [item.r2Key] : [];
}

async function loadCarousel() {
    try {
        const response = await fetch(window.GALLERY_API);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const allItems = await response.json();
        carouselImages = [];
        allItems.forEach(item => {
            const imageKeys = getItemImageKeys(item);
            imageKeys.forEach(key => {
                carouselImages.push({
                    src: imageUrl(key),
                    title: item.title || 'Project Image',
                    description: item.description || ''
                });
            });
        });
        if (carouselImages.length > 0) {
            startCarousel();
        }
    } catch (err) {
        console.error('Carousel load failed:', err);
        // Fallback to static images if API fails
        carouselImages = [
            { src: 'https://media.ideal-land-home.com/Land%20Management/lm1.webp', title: 'Land Clearing and Development', description: 'Complete property preparation for new construction.' },
            { src: 'https://media.ideal-land-home.com/Fencing/fence1.webp', title: 'Fencing and Outdoor Spaces', description: 'Offering strong, reliable fencing.' },
            { src: 'https://media.ideal-land-home.com/cabin1/cabin1_top.webp', title: 'Deck Construction', description: 'Beautiful, durable decks.' }
        ];
        startCarousel();
    }
}

function startCarousel() {
    if (carouselImages.length === 0) return;
    updateCarousel();
    startCarouselSlideshow();
}

function updateCarousel() {
    const imgEl = document.getElementById('carousel-img');
    if (!imgEl) return; // Carousel not on this page
    const current = carouselImages[currentCarouselIndex];
    imgEl.classList.add('is-fading');
    if (carouselSwapTimeoutId) clearTimeout(carouselSwapTimeoutId);
    carouselSwapTimeoutId = setTimeout(() => {
        imgEl.src = current.src;
        imgEl.alt = current.title;
        imgEl.classList.remove('is-fading');
    }, 120);
}

function nextCarousel() {
    currentCarouselIndex = (currentCarouselIndex + 1) % carouselImages.length;
    updateCarousel();
}

function prevCarousel() {
    currentCarouselIndex = (currentCarouselIndex - 1 + carouselImages.length) % carouselImages.length;
    updateCarousel();
}

function startCarouselSlideshow() {
    if (!carouselIntervalId) {
        carouselIntervalId = setInterval(nextCarousel, CAROUSEL_SLIDE_MS);
    }
}

function pauseCarousel() {
    if (carouselIntervalId) {
        clearInterval(carouselIntervalId);
        carouselIntervalId = null;
    }
}

function resumeCarousel() {
    startCarouselSlideshow();
}

// Initialize carousel on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Only load carousel if carousel element exists on page
    if (document.getElementById('carousel-img')) {
        loadCarousel();
    }

    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', pauseCarousel);
        carouselContainer.addEventListener('mouseleave', resumeCarousel);
    }

    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    if (prevBtn) prevBtn.addEventListener('click', prevCarousel);
    if (nextBtn) nextBtn.addEventListener('click', nextCarousel);
});