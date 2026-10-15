# Anton Shmatko — Portfolio

Static site. No build step, no dependencies.

## Files

- `index.html` — home page (hero, Selected work cards, Kind words testimonials)
- `work/index.html` — Work page with all case studies (served at `/work`)
- `about.html` — About page (served at `/about`)
- `privacy.html` — Privacy Policy, linked from every footer (served at `/privacy`)
- `work/<project>.html` — one page per case study
- `work/_template.html` — blank case page to copy for a new project (not linked anywhere, `noindex`)
- `assets/site.css`, `assets/site.js` — shared styles and behaviour (header, footer, starfield, reveal)
- `assets/work.css` — case study cards used on the home and Work pages
- `assets/case.css` — case page layout, placeholders, video controls
- `assets/media.js` — case page image placeholders and optional MP4 video support
- `media/<project>/` — images for each case
- `vercel.json` — `cleanUrls`, so `work/lumi-ai.html` is served at `/work/lumi-ai`

| Project | Page | Media folder |
| --- | --- | --- |
| Lumi AI | `work/lumi-ai.html` | `media/lumi-ai/` |
| Mava AI | `work/mava-ai.html` | `media/mava-ai/` |
| Furbnow | `work/furbnow.html` | `media/furbnow/` |
| Muso.AI | `work/muso-ai.html` | `media/muso-ai/` |

## Adding your content to a case

### Text

Open `work/<project>.html`. Everything still to write is marked with `class="ph-text"` and shows on the
page as a dashed lilac box. Replace the text and delete `class="ph-text"` from that element.

- Hero: My role, Scope, Platform, Year (`<dl class="case-meta">`)
- Sections: Overview, My role, Challenge, Approach, Outcome — each is a `<div class="case-text">`;
  add more `<p>` paragraphs inside `<div class="body">` as needed
### Images

Drop files into `media/<project>/` named by number. A placeholder shows the exact expected path until
the file exists; nothing in the HTML has to change.

| File | Where it appears |
| --- | --- |
| `01.jpg` | Cover under the title, and the "Next project" card on the previous case |
| `02.jpg` | Full width after "My role" |
| `03.jpg` | Full width after "Challenge" |
| `04.jpg`, `05.jpg` | Side by side after it |
| `06.jpg` | Full width after "Approach" |
| `07.jpg`, `08.jpg` | Side by side after "Outcome" |

Lumi AI uses its own layout with 15 images (`01.jpg` … `15.jpg`); see `work/lumi-ai.html`.

Recommended size: 2400×1350 for full-width images, 1600×900 or larger for side-by-side ones.
Other formats (`.png`, `.webp`) work too — change the extension in the `src` attribute.
To change the crop of a block, edit its `--ratio` (e.g. `style="--ratio: 4 / 3"`). Add `contain` to the
frame's class (`class="frame contain"`) to show the whole image without cropping.

### Video (optional)

Case pages no longer include video blocks, but `assets/media.js` still supports MP4 from a site file or
an external `https://` URL. To add one, put this inside a `<div class="gallery">`:

```html
<figure class="full">
  <div class="frame video" data-mode="full" style="--ratio: 16 / 9"
       data-src="https://cdn.example.com/demo.mp4" data-poster="../media/lumi-ai/demo-poster.jpg"></div>
</figure>
```

- `data-mode="preview"` — loads when scrolled near, plays muted in a loop, pauses off screen.
- `data-mode="full"` — loads nothing until the visitor presses **Play demo**, then plays with sound and controls.

Host long videos externally (e.g. Vercel Blob, Cloudflare R2): GitHub rejects files over 100 MB.

## Adding a new case

1. Copy `work/_template.html` to `work/<new-slug>.html` and fill it in.
2. Remove the `<meta name="robots" content="noindex">` line from the copy.
3. Create `media/<new-slug>/` for its files.
4. Add a card to `index.html` and to `work/index.html` (`<a class="work reveal" href="…/work/<new-slug>.html">`).
5. Update the "Next project" block on the case before it so the chain stays connected.

## Deploy to Vercel

Vercel is connected to the GitHub repository and deploys Production on every push to `main`.

## Run locally

Open the site through a local server (case pages load shared files from `assets/`):

```
npx serve .
```

`serve` handles clean URLs like Vercel, so `/work/lumi-ai` works locally as well.
