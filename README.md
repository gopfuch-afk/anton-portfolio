# Portfolio — Senior Product Designer

A single-page static site. No build step, no dependencies.

## Files

- `index.html` — the whole site (HTML, CSS and JS in one file)
- `vercel.json` — minimal Vercel config

## Before publishing

- Replace the placeholder email `your@email.com` in the Contact section (search for it in `index.html`).

## Deploy to Vercel

Option 1 — Vercel CLI:

```
npm i -g vercel
cd portfolio
vercel          # preview deployment
vercel --prod   # production deployment
```

Option 2 — Git:

1. Push this folder to a GitHub repository.
2. In Vercel choose "Add New → Project" and import the repository.
3. Framework Preset: "Other". Leave Build Command and Output Directory empty, Root Directory as `./`.
4. Click Deploy.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000
