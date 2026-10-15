# Anton Shmatko — Portfolio

Static site. No build step, no dependencies.

## Files

- `index.html` — home page (hero, Selected work cards, Kind words testimonials)
- `work/<project>.html` — one page per case study
- `work/_template.html` — blank case page to copy for a new project (not linked anywhere, `noindex`)
- `assets/site.css`, `assets/site.js` — shared styles and behaviour (header, footer, starfield, reveal)
- `assets/case.css` — case page layout, placeholders, video controls
- `assets/media.js` — images and MP4 videos on case pages (lazy loading, placeholders)
- `media/<project>/` — images and videos for each case
- `vercel.json` — `cleanUrls`, so `work/lumi-ai.html` is served at `/work/lumi-ai`

| Project | Page | Media folder |
| --- | --- | --- |
| Lumi AI | `work/lumi-ai.html` | `media/lumi-ai/` |
| Mava AI | `work/mava-ai.html` | `media/mava-ai/` |
| Furbnow | `work/furbnow.html` | `media/furbnow/` |
| Falc AI | `work/falc-ai.html` | `media/falc-ai/` |
| Unagi / Ultimate Champions | `work/unagi.html` | `media/unagi/` |
| Aurbitrage | `work/aurbitrage.html` | `media/aurbitrage/` |
| Trumpet | `work/trumpet.html` | `media/trumpet/` |
| Muso.AI | `work/muso-ai.html` | `media/muso-ai/` |

## Adding your content to a case

### Text

Open `work/<project>.html`. Everything still to write is marked with `class="ph-text"` and shows on the
page as a dashed lilac box. Replace the text and delete `class="ph-text"` from that element.

- Hero: My role, Scope, Platform, Year (`<dl class="case-meta">`)
- Sections: Overview, My role, Challenge, Approach, Outcome — each is a `<div class="case-text">`;
  add more `<p>` paragraphs inside `<div class="body">` as needed
- Caption under the demo video (`<figcaption>`)

### Images and videos

Drop files into `media/<project>/` with these names. A placeholder shows the exact expected path until
the file exists; nothing in the HTML has to change.

| File | Where it appears | Recommended |
| --- | --- | --- |
| `cover.jpg` | Hero image, and the "Next project" card on the previous case | 2400×1350 |
| `preview.mp4` | Muted looping preview after "My role" | 5–15 s, 1920×1080, H.264, ideally < 8 MB |
| `preview-poster.jpg` | Still frame shown before the preview loads | First frame of the video |
| `screen-1.jpg` | Full-width image after "Challenge" | 2400×1350 |
| `screen-2.jpg`, `screen-3.jpg` | Two images side by side | 1600×1200 |
| `demo.mp4` | Full demo with sound and controls after "Approach" | 1920×1080, H.264 |
| `demo-poster.jpg` | Cover shown on the demo before Play | First frame of the video |
| `screen-4.jpg`, `screen-5.jpg` | Two images after "Outcome" | 1600×1200 |

Other formats (`.png`, `.webp`) work too — change the extension in the `src` / `data-poster` attribute.
To change the crop of a block, edit its `--ratio` (e.g. `style="--ratio: 4 / 3"`). Add `contain` to the
frame's class (`class="frame contain"`) to show the whole image without cropping.

### Videos from an external URL

Put a direct `https://` link to an `.mp4` file in `data-src` (and optionally `data-poster`):

```html
<div class="frame video" data-mode="full" data-src="https://cdn.example.com/lumi-demo.mp4"
     data-poster="../media/lumi-ai/demo-poster.jpg" style="--ratio: 16 / 9"></div>
```

Use external hosting (e.g. Vercel Blob, Cloudflare R2, Bunny) for long demos: GitHub rejects files over
100 MB and large videos slow down every clone and deploy.

### How videos load

- `data-mode="preview"` — downloads only when scrolled near, plays muted in a loop, pauses off screen,
  has a small pause button. With "reduce motion" enabled it waits for a click.
- `data-mode="full"` — downloads nothing until the visitor presses **Play demo**, then plays with sound
  and the browser's native controls.

## Adding a new case

1. Copy `work/_template.html` to `work/<new-slug>.html` and fill it in.
2. Remove the `<meta name="robots" content="noindex">` line from the copy.
3. Create `media/<new-slug>/` for its files.
4. Add a card to `index.html` (`<a class="work reveal" href="work/<new-slug>.html">`).
5. Update the "Next project" block on the case before it so the chain stays connected.

## Deploy to Vercel

Vercel is connected to the GitHub repository and deploys Production on every push to `main`.

## Run locally

Open the site through a local server (case pages load shared files from `assets/`):

```
npx serve .
```

`serve` handles clean URLs like Vercel, so `/work/lumi-ai` works locally as well.
