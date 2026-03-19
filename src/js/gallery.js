/* jshint esversion: 11 */
'use strict';

const GALLERY_API = '/api/gallery';
const MEDIA_BASE_URL = 'https://media.ideal-land-home.com';
const CARD_SLIDE_MS = 3500;

let allItems = [];
let filteredItems = [];
let currentIndex = 0;
let lastFocused = null;
let cardSlideTimers = [];
let cardSwapTimers = [];

// ─── Utility ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

function imageUrl(r2Key) {
    if (!r2Key) return '';
    // Allow full URLs in KV, otherwise resolve against media host.
    if (/^https?:\/\//i.test(r2Key)) return r2Key;
    const cleanKey = String(r2Key).replace(/^\/+/, '');
    return `${MEDIA_BASE_URL}/${cleanKey}`;
}

function getItemImageKeys(item) {
    if (Array.isArray(item.images) && item.images.length > 0) {
        return item.images.filter(Boolean);
    }
    return item.r2Key ? [item.r2Key] : [];
}

function clearCardSlideshows() {
    cardSlideTimers.forEach(id => window.clearInterval(id));
    cardSwapTimers.forEach(id => window.clearTimeout(id));
    cardSlideTimers = [];
    cardSwapTimers = [];
}

function startCardSlideshow(card, imgEl, imageSources) {
    if (!imgEl || imageSources.length <= 1) return;

    let imageIndex = 0;
    let intervalId = null;

    const step = () => {
        imageIndex = (imageIndex + 1) % imageSources.length;
        imgEl.classList.add('is-fading');
        const swapId = window.setTimeout(() => {
            imgEl.src = imageSources[imageIndex];
            imgEl.classList.remove('is-fading');
        }, 120);
        cardSwapTimers.push(swapId);
    };

    const startSlide = () => {
        if (!intervalId) {
            intervalId = window.setInterval(step, CARD_SLIDE_MS);
            cardSlideTimers.push(intervalId);
        }
    };

    const pauseSlide = () => {
        if (intervalId) {
            window.clearInterval(intervalId);
            intervalId = null;
        }
    };

    startSlide();
    card.addEventListener('mouseenter', pauseSlide);
    card.addEventListener('mouseleave', startSlide);
    card.addEventListener('focusin', pauseSlide);
    card.addEventListener('focusout', startSlide);
}

// ─── Gallery Load ────────────────────────────────────────────────────────────

async function loadGallery() {
    const loading = document.getElementById('gallery-loading');
    const errorEl = document.getElementById('gallery-error');

    try {
        const response = await fetch(GALLERY_API);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        allItems = await response.json();
        filteredItems = [...allItems];

        // Debug: log what was returned
        console.log('[Gallery] API returned:', allItems.length, 'items');
        allItems.forEach((item, i) => {
            const imageCount = Array.isArray(item.images) ? item.images.length : (item.r2Key ? 1 : 0);
            console.log(`  [${i}] ${item.title}: ${imageCount} image(s)`, item.images || item.r2Key);
        });

        buildFilters();
        renderGrid();
    } catch (err) {
        console.error('Gallery load failed:', err);
        loading.hidden = true;
        errorEl.hidden = false;
    }
}

// ─── Filters ─────────────────────────────────────────────────────────────────

function buildFilters() {
    const categories = [...new Set(allItems.map(item => item.category).filter(Boolean))];
    const container = document.getElementById('gallery-filters');

    if (categories.length === 0) {
        container.hidden = true;
        return;
    }

    const allBtn = container.querySelector('[data-filter="all"]');
    allBtn.addEventListener('click', () => setFilter('all'));

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = cat;
        btn.textContent = cat;
        btn.addEventListener('click', () => setFilter(cat));
        container.appendChild(btn);
    });
}

function setFilter(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === category);
    });

    filteredItems = category === 'all'
        ? [...allItems]
        : allItems.filter(item => item.category === category);

    renderGrid();
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderGrid() {
    const grid = document.getElementById('gallery-grid');
    const loading = document.getElementById('gallery-loading');
    const emptyEl = document.getElementById('gallery-empty');

    clearCardSlideshows();
    loading.hidden = true;
    grid.innerHTML = '';

    if (filteredItems.length === 0) {
        emptyEl.hidden = false;
        return;
    }

    emptyEl.hidden = true;

    filteredItems.forEach((item, idx) => {
        grid.appendChild(buildCard(item, idx));
    });
}

function buildCard(item, idx) {
    const card = document.createElement('article');
    card.className = 'gallery-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${item.title || 'project image'}`);
    card.dataset.index = idx;

    const imageKeys = getItemImageKeys(item);
    const imageSources = imageKeys.map(imageUrl).filter(Boolean);
    const src = imageSources[0] || '';
    const alt = escapeHtml(item.title || 'Project image');
    const title = escapeHtml(item.title || 'Untitled Project');
    const desc = item.description ? `<p>${escapeHtml(item.description)}</p>` : '';
    const category = item.category ? `<span class="gallery-card-category">${escapeHtml(item.category)}</span>` : '';
    const dateStr = item.date
        ? `<time datetime="${escapeHtml(item.date)}">${new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</time>`
        : '';

    card.innerHTML = `
        <div class="gallery-card-img-wrap">
            ${src ? `<img src="${src}" alt="${alt}" loading="lazy">` : ''}
            ${category}
        </div>
        <div class="gallery-card-body">
            <h3>${title}</h3>
            ${desc}
            ${dateStr}
        </div>
    `;

    card.addEventListener('click', () => openLightbox(idx, card));
    card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(idx, card);
        }
    });

    const cardImg = card.querySelector('.gallery-card-img-wrap img');
    startCardSlideshow(card, cardImg, imageSources);

    return card;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function openLightbox(idx, triggerEl) {
    lastFocused = triggerEl || document.activeElement;
    currentIndex = idx;
    lightboxImageIndex = 0;

    const lb = document.getElementById('gallery-lightbox');
    lb.hidden = false;
    document.body.style.overflow = 'hidden';

    updateLightbox();
    document.getElementById('lightbox-close').focus();
}

function closeLightbox() {
    const lb = document.getElementById('gallery-lightbox');
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
}

function updateLightbox() {
    const item = filteredItems[currentIndex];
    const lb = document.getElementById('gallery-lightbox');
    const img = lb.querySelector('.lightbox-img');
    const titleEl = lb.querySelector('.lightbox-title');
    const descEl = lb.querySelector('.lightbox-desc');
    const counter = lb.querySelector('.lightbox-counter');

    const imageKeys = getItemImageKeys(item);
    const currentImageUrl = imageKeys[lightboxImageIndex] ? imageUrl(imageKeys[lightboxImageIndex]) : '';
    img.src = currentImageUrl;
    img.alt = item.title || 'Project image';
    titleEl.textContent = item.title || '';
    descEl.textContent = item.description || '';

    // Show which image within project, and total projects
    if (imageKeys.length > 1) {
        counter.textContent = `${lightboxImageIndex + 1} / ${imageKeys.length} images in project (Project ${currentIndex + 1} / ${filteredItems.length})`;
    } else {
        counter.textContent = `Project ${currentIndex + 1} / ${filteredItems.length}`;
    }

    // Prev/Next buttons only disabled at gallery edges when on single-image projects
    const isMultiImage = imageKeys.length > 1;
    lb.querySelector('.lightbox-prev').disabled = !isMultiImage && currentIndex === 0;
    lb.querySelector('.lightbox-next').disabled = !isMultiImage && currentIndex === filteredItems.length - 1;
}

let lightboxImageIndex = 0;

function lightboxPrev() {
    const item = filteredItems[currentIndex];
    const imageKeys = getItemImageKeys(item);
    if (imageKeys.length > 1) {
        lightboxImageIndex = (lightboxImageIndex - 1 + imageKeys.length) % imageKeys.length;
    } else if (currentIndex > 0) {
        currentIndex--;
        lightboxImageIndex = 0;
    }
    updateLightbox();
}

function lightboxNext() {
    const item = filteredItems[currentIndex];
    const imageKeys = getItemImageKeys(item);
    if (imageKeys.length > 1) {
        lightboxImageIndex = (lightboxImageIndex + 1) % imageKeys.length;
    } else if (currentIndex < filteredItems.length - 1) {
        currentIndex++;
        lightboxImageIndex = 0;
    }
    updateLightbox();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    loadGallery();

    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.querySelector('.lightbox-prev').addEventListener('click', lightboxPrev);
    document.querySelector('.lightbox-next').addEventListener('click', lightboxNext);

    // Close on overlay click
    document.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        const lb = document.getElementById('gallery-lightbox');
        if (lb.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lightboxPrev();
        if (e.key === 'ArrowRight') lightboxNext();
    });
});
