# Gallery Management Guide
**IDEAL Land & Home Contractors LLC**

This guide explains how to add, update, and remove photos from the website gallery. Everything is managed through the Cloudflare dashboard — no coding required.

---

## How the Gallery Works

The gallery uses two Cloudflare services:

| Service | What it stores |
|---|---|
| **R2** (file storage) | The actual image files (`.jpg`, `.webp`, `.png`, etc.) |
| **KV** (key-value store) | Metadata for each gallery item: title, description, category, display order, and which image(s) to show |

When a visitor opens the gallery page, the site reads all KV entries to get the list of projects, then loads the images from R2.

---

## Logging Into Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and log in.
2. In the left sidebar, click **Workers & Pages**.
3. You will see the R2 and KV sections in the sidebar under **Storage & Databases**.

---

## Part 1 — Managing Images (R2)

### Upload a New Image

1. In the Cloudflare sidebar, click **R2 Object Storage**.
2. Click the bucket named **`ideallandhome`**.
3. Click **Upload** and select your image file(s).
4. Choose or type a folder path before uploading. Recommended folder structure:

    ```
    projects/deck-builds/
    projects/fencing/
    projects/land-clearing/
    projects/pergolas/
    projects/siding/
    ```

    > **Tip:** If you want multiple photos grouped under one gallery card, put them all in the same folder (e.g. `projects/deck-smith-2026/`). The gallery will automatically display all images in that folder as a slideshow.

5. Note the full path of each uploaded file — you will need it when creating a KV entry (e.g. `projects/deck-builds/img1.webp`).

### Delete an Image

1. Open the **`ideallandhome`** R2 bucket.
2. Find the file, check its box, and click **Delete**.

> **Note:** If you delete an image that is referenced in a KV entry, that gallery card will have a broken image. Either update the KV entry to point to a different image, or delete the KV entry as well.

---

## Part 2 — Managing Gallery Entries (KV)

Each gallery card on the website corresponds to one **KV entry**. The key is formatted as `gallery:001`, `gallery:002`, etc.

### Open the KV Namespace

1. In the Cloudflare sidebar, click **KV** under Storage & Databases.
2. Click the namespace named **`ideallandhome-kv`**.
3. You will see a list of all existing keys.

---

### Add a New Gallery Card

1. Click **Add entry**.
2. Set the **Key** to the next number in sequence, e.g. `gallery:010`.
3. Set the **Value** to a JSON block like the examples below.
4. Click **Save**.

#### Single-image card
```json
{
  "title": "Cedar Privacy Fence — Bentonville",
  "description": "8-foot cedar privacy fence installed along a 200-ft property line.",
  "category": "Fencing",
  "r2Key": "projects/fencing/cedar-fence-bentonville.webp",
  "date": "2026-03-15",
  "featured": false,
  "order": 10
}
```

#### Multi-image card (folder of photos)
```json
{
  "title": "Composite Deck Build — Rogers",
  "description": "Custom composite deck with built-in bench seating and pergola.",
  "category": "Custom Deck Building",
  "r2Prefix": "projects/deck-rogers-2026/",
  "date": "2026-02-20",
  "featured": true,
  "order": 2
}
```
> With `r2Prefix`, every image file inside that R2 folder is automatically included and displayed as a slideshow on the gallery card.

---

### Field Reference

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Name shown on the gallery card |
| `category` | Yes | Service type (see categories below) |
| `r2Key` | Yes (single image) | Full path of the image in R2, e.g. `projects/fencing/img.webp` |
| `r2Prefix` | Yes (multiple images) | R2 folder path ending with `/`, e.g. `projects/deck-rogers-2026/` |
| `description` | No | Short caption shown on the card |
| `date` | No | Project date in `YYYY-MM-DD` format |
| `featured` | No | Set to `true` to highlight the card (default `false`) |
| `order` | No | Number that controls sort order — lower numbers appear first |

**Use either `r2Key` or `r2Prefix`, not both.**

#### Available Categories
- `Custom Deck Building`
- `Fencing`
- `Siding, Soffit, & Fascia`
- `Shelters & Safe Rooms`
- `Land Management & Demolition`
- `Outdoor Living Spaces & Pergolas`
- `Pool Services`

---

### Edit an Existing Gallery Card

1. In the KV namespace, find the key you want to change (e.g. `gallery:005`).
2. Click the key to open it.
3. Edit the JSON value as needed.
4. Click **Save**.

Changes appear on the live website within a few seconds.

---

### Delete a Gallery Card

1. In the KV namespace, find the key for the card you want to remove.
2. Click the **…** menu next to the key and select **Delete**.

This removes the card from the gallery. It does **not** delete the image from R2.

---

### Change the Display Order

The `order` field controls which cards appear first. Lower numbers appear earlier.

- Set `"order": 1` for the card you want first.
- Set `"order": 2` for second, and so on.
- Cards without an `order` field are sorted to the end.

To reorder, simply edit the `order` value in each relevant KV entry.

---

## Part 3 — Image Tips

| Tip | Detail |
|---|---|
| **Format** | Use `.webp` for the best quality-to-file-size ratio. `.jpg` works too. |
| **File size** | Keep images under 500 KB each where possible for fast loading. |
| **File names** | Use lowercase letters, numbers, and hyphens — avoid spaces (e.g. `cedar-fence-1.webp`). |
| **Updating a photo** | Upload the new image under a **different filename**, then update the `r2Key` in the KV entry. Images are cached aggressively by the CDN, so reusing the same filename will not update what visitors see immediately. |

---

## Quick Reference Checklist

### To add a new gallery project:
- [ ] Upload image(s) to R2 under `projects/your-folder/`
- [ ] Create a new KV entry (`gallery:NNN`) with the correct `r2Key` or `r2Prefix`
- [ ] Set `order` to control where it appears in the gallery
- [ ] Check the live gallery page to confirm it appears correctly

### To remove a gallery project:
- [ ] Delete (or leave) the image(s) in R2
- [ ] Delete the KV entry for that card

### To update a photo on an existing card:
- [ ] Upload the new image to R2 with a new filename
- [ ] Edit the KV entry to point `r2Key` to the new filename
- [ ] Optionally delete the old image from R2

---

## Need Help?

Contact your web developer at [warstlerdigital.com](https://warstlerdigital.com) for assistance with anything beyond this guide.
