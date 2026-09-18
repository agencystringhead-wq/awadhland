# awadhland.com

Read `docs/BUILD-SPEC.md` before any structural change. It is the source of truth for page templates, URL structure, data schemas, components and SEO rules. If a request conflicts with it, say so and ask before deviating.

## House rules

- Next.js 15 App Router, TypeScript, Tailwind. `output: 'export'`. Node 22. No server routes, no ISR, no runtime fetching.
- Deploys to Cloudflare Pages from GitHub (`agencystringhead-wq/awadhland`).
- Work on feature branches. Open PRs into `main`. Never commit directly to `main`.
- No `Co-Authored-By` lines in commits.
- Audit first: before editing, read the files involved and state what you will change.
- All entity data lives in `/data/*.json`, validated by Zod in `/lib/schemas.ts`. `npm run validate` must pass before `npm run build`. A failing validation is a build failure, not a warning.
- Two route trees: `/app/(en)/...` for English and `/app/hi/...` for Hindi. Locale comes from the route segment only. Never redirect by browser language, cookie or IP.
- Every data page renders a `SourceStamp` with source and `updatedAt`. If a record lacks sources, it does not ship.
- Localities missing the minimum field set (see spec, Template 3 rules) are excluded from `generateStaticParams` and the sitemap. Log the skipped ids at build.
- Images: WebP (AVIF where supported), explicit width and height, re-encoded to roughly 60–115 KB at q90 before commit. Media hosted on Cloudflare R2.
- Fonts self-hosted. Fraunces (display serif, weights 350–480) for headings, ledes and card titles, with Instrument Serif italic for the accent phrase; Inter 500–600 for body, buttons and labels; JetBrains Mono for eyebrows and captions. Noto Sans Devanagari at 600 for Hindi headings; body 17px English, 18px Hindi. Measured values in `docs/DESIGN-REFERENCE.md`.
- No third-party scripts except JotForm on form load and Leaflet on map pages.
- Titles and meta descriptions are written per language, not translated.

## When reporting back

- List files touched.
- For any CSS or layout change, report before and after values so they can be tuned by number.
- Note every deviation from `docs/BUILD-SPEC.md` and why.
