/* jshint esversion: 11 */
'use strict';

const GALLERY_API = '/api/gallery';
const MEDIA_BASE_URL = 'https://media.ideal-land-home.com';

let allItems = [];
let filteredItems = [];
let currentIndex = 0;
let lastFocused = null;

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

// ─── Gallery Load ────────────────────────────────────────────────────────────

async function loadGallery() {
    const loading = document.getElementById('gallery-loading');
    const errorEl = document.getElementById('gallery-error');

    try {
        const response = await fetch(GALLERY_API);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        allItems = await response.json();
        filteredItems = [...allItems];

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

    const src = item.r2Key ? imageUrl(item.r2Key) : '';
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

    return card;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function openLightbox(idx, triggerEl) {
    lastFocused = triggerEl || document.activeElement;
    currentIndex = idx;

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

    img.src = item.r2Key ? imageUrl(item.r2Key) : '';
    img.alt = item.title || 'Project image';
    titleEl.textContent = item.title || '';
    descEl.textContent = item.description || '';
    counter.textContent = `${currentIndex + 1} / ${filteredItems.length}`;

    lb.querySelector('.lightbox-prev').disabled = currentIndex === 0;
    lb.querySelector('.lightbox-next').disabled = currentIndex === filteredItems.length - 1;
}

function lightboxPrev() {
    if (currentIndex > 0) {
        currentIndex--;
        updateLightbox();
    }
}

function lightboxNext() {
    if (currentIndex < filteredItems.length - 1) {
        currentIndex++;
        updateLightbox();
    }
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
