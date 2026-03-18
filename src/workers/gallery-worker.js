/**
 * IDEAL Land & Home — Gallery Cloudflare Worker
 *
 * Bindings required in wrangler.json:
 *   - ideallandhome-kv  : KV Namespace  — stores per-item metadata
 *   - ideallandhome-r2 : R2 Bucket  — stores image files
 *   - ASSETS      : Workers Assets binding (auto-provided)
 *
 * KV Entry format  (key: "gallery:<id>", e.g. "gallery:001"):
 * {
 *   "title":       "Kitchen Renovation",
 *   "description": "Full kitchen remodel in Jonesboro, AR.",
 *   "category":    "Renovation",
 *   "r2Key":       "projects/kitchen-jonesboro.jpg",
 *   "date":        "2026-02-01",
 *   "featured":    true,
 *   "order":       1
 * }
 *
 * CLI to add an entry:
 *   wrangler kv key put "gallery:001" '{"title":"My Project","r2Key":"projects/img.jpg","category":"Land Clearing","order":1}' --binding ideallandhome-kv
 *
 * CLI to upload an image to R2:
 *   wrangler r2 object put ideallandhome-gallery/projects/img.jpg --file ./img.jpg
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Keys that start with this prefix are treated as gallery entries
const KV_PREFIX = 'gallery:';

export default {
    /**
     * @param {Request} request
     * @param {Record<string, any>} env
     */
    async fetch(request, env) {
        const url = new URL(request.url);

        // ── CORS preflight ──────────────────────────────────────────────────
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        // Only allow GET for all custom routes
        if (request.method !== 'GET') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        // ── Serve images from R2 ────────────────────────────────────────────
        // Route: /images/<r2Key>
        if (url.pathname.startsWith('/images/')) {
            return serveImage(url.pathname, env);
        }

        // ── Gallery API ─────────────────────────────────────────────────────
        // Route: /api/gallery
        if (url.pathname === '/api/gallery') {
            return serveGalleryList(env);
        }

        // ── Static assets (HTML, CSS, JS, etc.) ────────────────────────────
        if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
            return env.ASSETS.fetch(request);
        }
        return new Response('Not Found', { status: 404 });
    },
};

function getKv(env) {
    return env.GALLERY_KV || env['ideallandhome-kv'];
}

function getBucket(env) {
    return env.GALLERY_BUCKET || env['ideallandhome-r2'];
}

// ─── Image Serving ────────────────────────────────────────────────────────────

async function serveImage(pathname, env) {
    const bucket = getBucket(env);
    if (!bucket) {
        return new Response('R2 bucket not configured.', { status: 503 });
    }

    // Decode and validate the key — prevent path traversal
    let key;
    try {
        key = decodeURIComponent(pathname.slice('/images/'.length));
    } catch {
        return new Response('Bad Request', { status: 400 });
    }

    if (!key || key.includes('..') || key.startsWith('/')) {
        return new Response('Bad Request', { status: 400 });
    }

    const object = await bucket.get(key);

    if (!object) {
        return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    // Cache images aggressively — re-upload to R2 with a new key to invalidate
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, { headers });
}

// ─── Gallery List API ─────────────────────────────────────────────────────────

async function serveGalleryList(env) {
    const kv = getKv(env);
    if (!kv) {
        return jsonResponse([], 200);
    }

    try {
        // Prefer explicit gallery keys. If none are found, fall back to all keys.
        let keys = await listKvKeys(kv, KV_PREFIX);
        if (keys.length === 0) {
            keys = await listKvKeys(kv);
        }

        if (keys.length === 0) {
            return jsonResponse([]);
        }

        // Fetch all metadata in parallel
        const items = await Promise.all(
            keys.map(async ({ name }) => {
                const value = await kv.get(name, { type: 'json' });
                if (!value || typeof value !== 'object') return null;
                // Only surface objects that look like gallery items.
                if (!value.r2Key && !value.title) return null;
                return { id: name, ...value };
            })
        );

        const sorted = items
            .filter(Boolean)
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

        return jsonResponse(sorted);
    } catch (err) {
        console.error('Gallery KV error:', err);
        return jsonResponse({ error: 'Failed to load gallery.' }, 500);
    }
}

async function listKvKeys(kv, prefix) {
    const keys = [];
    let cursor;

    do {
        /** @type {KVNamespaceListResult} */
        const page = prefix
            ? await kv.list({ prefix, cursor })
            : await kv.list({ cursor });
        keys.push(...page.keys);
        cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    return keys;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
        },
    });
}
