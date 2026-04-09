# IDEAL Land & Home Contractors Website

Static marketing site and dynamic gallery for IDEAL Land & Home Contractors LLC.

The site is served by Cloudflare Workers + Assets, with gallery metadata in KV and gallery media in R2.

## Live Site

- https://ideal-land-home.com

## Tech Stack

- HTML, CSS, vanilla JavaScript
- Cloudflare Workers (routing + gallery API)
- Cloudflare Assets (static pages and files)
- Cloudflare KV (`ideallandhome-kv`) for gallery metadata
- Cloudflare R2 (`ideallandhome-r2`) for gallery images
- Web3Forms for contact form submissions
- Google Analytics (gtag)

## Repository Layout

```text
.
├── GALLERY-MANAGEMENT.md
├── README.md
└── src/
    ├── index.html
    ├── about.html
    ├── contact.html
    ├── gallery.html
    ├── 404.html
    ├── legal/
    │   ├── privacy.html
    │   └── terms.html
    ├── css/
    ├── js/
    ├── workers/
    │   └── gallery-worker.js
    ├── _headers
    ├── _redirects
    ├── _routes.json
    └── wrangler.json
```

## How It Works

- Static pages are served from `src/` through Cloudflare Assets.
- Worker entrypoint is `src/workers/gallery-worker.js`.
- Worker routes:
  - `GET /api/gallery` returns gallery entries from KV, enriched with images from R2.
  - `GET /images/<key>` can serve R2 objects through the worker route.
- Frontend gallery currently renders images from media host URLs (`https://media.ideal-land-home.com/<r2Key>`).

## Prerequisites

- Node.js 18+
- Cloudflare account with access to:
  - Worker
  - KV namespace
  - R2 bucket
- Wrangler CLI (`npm i -g wrangler`)

## Local Development

Run from the `src/` directory so Wrangler picks up `wrangler.json`.

```bash
cd src
wrangler dev --config wrangler.json
```

Then open the local URL Wrangler prints.

## Deploy

```bash
cd src
wrangler deploy --config wrangler.json
```

## Cloudflare Configuration

Current configuration is defined in `src/wrangler.json`:

- Worker name: `ideal-land-home`
- Worker main: `./workers/gallery-worker.js`
- Assets directory: `./`
- KV binding: `ideallandhome-kv`
- R2 binding: `ideallandhome-r2`

If bindings or IDs change in Cloudflare, update `wrangler.json` before deploying.

## Content Editing

### Page Content

Edit these files directly:

- Home: `src/index.html`
- About: `src/about.html`
- Contact: `src/contact.html`
- Gallery shell page: `src/gallery.html`
- Legal pages: `src/legal/privacy.html`, `src/legal/terms.html`

Shared layout/styling:

- Header styles: `src/css/headers.css`
- Footer styles: `src/css/footers.css`
- Home/global styles: `src/css/index.css`

### Gallery Content

Gallery data is not hardcoded in HTML. It comes from Cloudflare KV + R2.

- Full operational guide: `GALLERY-MANAGEMENT.md`
- KV entry keys follow `gallery:<id>` (example: `gallery:010`)
- Use either:
  - `r2Key` for a single image, or
  - `r2Prefix` for all images in a folder

## Contact Form

The contact page posts to Web3Forms in `src/js/contact.js`.

The Web3Forms `access_key` is stored in a hidden field in `src/contact.html`.

If you rotate or replace the key:

1. Update the `access_key` hidden input in `src/contact.html`.
2. Test form submission on `/contact`.
3. Redeploy.

## Routing and Security Headers

- Redirect rules: `src/_redirects`
- Header/security policy rules: `src/_headers`
- Route include/exclude + 404 behavior: `src/_routes.json`

## Troubleshooting

### Gallery does not load

- Confirm Worker is deployed successfully.
- Confirm KV namespace has valid JSON entries.
- Confirm R2 keys/prefixes referenced in KV actually exist.
- Check browser console and Worker logs for `/api/gallery` errors.

### Images are stale after replacement

Image responses are aggressively cached. Upload new images with new filenames, then update KV references.

### Contact form fails

- Confirm Web3Forms key is valid.
- Confirm CSP in `_headers` still allows `https://api.web3forms.com` in `connect-src` and `form-action`.

## Maintenance Notes

- Keep image filenames lowercase and hyphenated.
- Prefer `.webp` images for smaller payloads.
- Keep redirects and canonical URLs aligned when adding pages.

## License

Private/proprietary project for IDEAL Land & Home Contractors LLC unless stated otherwise.
