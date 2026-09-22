# awadhland.com

Land-buying authority site for Ayodhya, Lucknow and Gorakhpur. Static Next.js export deployed to Cloudflare Pages.

`docs/BUILD-SPEC.md` is the source of truth for templates, URLs, data model, components and SEO. `CLAUDE.md` has the house rules. Change the spec first, then the code.

## Quick start

Node 22 (`.nvmrc`).

```bash
npm install
npm run validate   # schemas + cross-file checks + guide frontmatter; exits 1 on any error
npm run build      # runs validate first (prebuild), then next build → static site in out/
npm run dev        # local dev server
npm run typecheck
```

A failing validation is a build failure. The loaders in `lib/data.ts` also validate on import, so a bare `next build` fails on bad data too.

## Lead form, WhatsApp and analytics

The site stays static. Enquiry forms (hero card, lead-form band, every `LeadForm` block) and the digest signup post JSON to the `awadhland-leads` Worker in `worker/`, which validates and creates the JotForm submission through JotForm's API. JotForm's script never loads on the site. Set `NEXT_PUBLIC_LEAD_ENDPOINT` (see `.env.example`) in the Pages build environment; without it, forms compose a WhatsApp message instead and analytics is off, which is the right behaviour for previews.

Analytics is first-party and script-free: `whatsapp_click`, `call_click`, `lead_submit`, `lead_fail` and `digest_subscribe` go to the Worker's `/event` and land in a Workers Analytics Engine dataset. No cookies, no personal data. Page views are not tracked from the site; enable Cloudflare Web Analytics on the Pages project if they are wanted. Deploy and configuration steps are in `worker/README.md`.

## Content workflow

Every locality is `draft` or `live` (`status` in `data/localities.json`). Drafts render on every build with a notice, are `noindex`, and stay out of the sitemaps; `npm run validate` asserts this. Nothing scrapes a live site at build; data arrives through these steps.

**Circle rates from the IGRSUP list.** There are two paths, depending on what you have.

*A full transcribed list* (every column of प्रारूप-4 and प्रारूप-3, one CSV per SRO) is the real one. Put the CSVs under `data/sources/circle-rates/<city>/transcribed-<effective>/`, then:

```bash
npm run rates:import-list -- --city ayodhya --effective 2025-06-07 --order-date 2025-06-06 --dir data/sources/circle-rates/ayodhya/transcribed-2025-06-07 --dry-run
```

The dry run reports rows per SRO, localities matched and unmatched (with candidate row and segment ids for each), unmatched road segments, and slug collisions inside a tehsil. It writes nothing. Map the unmatched localities in `scripts/rate-aliases.json` — most need a human, because the list splits one locality across several rows (देवकाली is three rows in Sadar) or names a corridor by an older road description. Then drop `--dry-run`.

That writes `data/rates/<city>-<effective>.json` (a revision is a new file, never an overwrite) and sets `rateRefs` on the localities it matched. Names come from `lib/devanagari.ts`, which does Hindi schwa deletion so रिकाबगंज is `rikabganj` and not `rikabaganja`; override a spelling in `scripts/name-overrides.json` rather than loosening the rules.

`npm run rates:derive` then regenerates `data/circleRates.json` from it, and `npm run rates:chunks` writes the per-tehsil search chunks into `public/rates/`. Both run in `prebuild`, so **`circleRates.json` is generated and must not be hand-edited**.

*A three-number-per-locality CSV* (columns `locality, tehsil, residential, commercial, agricultural`) is the older, narrower path, still there for a city whose full list has not been transcribed:

```bash
npm run rates:import -- --city lucknow --effective 2026-08-01 --source https://igrsup.gov.in/<schedule.pdf> --csv path/to/lucknow.csv --dry-run
```

It matches by id, name, Hindi name or `scripts/circle-rate-aliases.json`, and writes each locality's `circleRate` directly. A sample CSV is in `scripts/samples/`. Note that `rates:derive` will overwrite the schedule of any city that also has a file in `data/rates/`.

The scanned source PDFs are gitignored: they are provenance, and the archived copies belong on R2.

**Upgrading a draft to live.** After the schedule is in: fill `askingRange` (with `asOf`), `landUse` and `landUseSource` from the master plan, `driveTimes` per anchor, `narrative.drivers` and `driversHi` in the broker's words, `fit`, `pros`/`cons`/`risks` where known, `brokerNote` with its date; replace the placeholder `sources` with the real documents; delete the seed `todo` lines; set `status` to `live`. The page indexes on the next build.

**Guides.** One MDX file per language under `content/guides/` and `content/hi/guides/`, written separately, never translated. Frontmatter is validated; bodies compile at validate time and may use `<CircleRate>`, `<Distance>`, `<ProjectCard>`, `<Callout>` and `<Checklist>`. Reference only `live` localities from guides, since draft figures are placeholders. Validate warns when a guide links fewer than three data pages.

**Seeds.** `npm run seed:cities` regenerates missing draft records for the three cities and never overwrites an existing id.

## Folder structure

```
app/
  globals.css                Design tokens (@theme), type scale, layout utilities. Tune numbers here.
  fonts.ts                   Self-hosted Inter and Noto Sans Devanagari via next/font/local
  icon.svg                   Favicon
  (en)/                      English tree, served at the root. Own root layout: <html lang="en-IN">
    layout.tsx
    page.tsx                 /
    [city]/page.tsx          /ayodhya/
    [city]/[locality]/       /ayodhya/faizabad-road/        (thin-page guard applied)
    [city]/circle-rates/     /ayodhya/circle-rates/
      [tehsil]/              /ayodhya/circle-rates/sadar/
        [village]/           /ayodhya/circle-rates/sadar/sahadatganj/
    projects/[slug]/         /projects/ayodhya-airport-expansion/
    guides/[slug]/           /guides/buy-land-in-ayodhya-as-nri/
    updates/                 /updates/
    updates/[slug]/          /updates/2026-09-.../
    about/                   /about/
  hi/                        Hindi tree, same paths under /hi/. Own root layout: <html lang="hi-IN">
components/
  *.tsx                      Shared components from the spec (Header, LeadForm, SourceStamp, ...)
                             plus the six trust components (TrustBar, BrokerCard, WhyWeExist,
                             HowWeWork, Reviews, Badges). LocalityMap is the only client
                             component; it lazy-loads Leaflet so it ships on map pages only.
  templates/                 One template per page type. Route files in both trees are thin
                             wrappers that pass locale="en" or locale="hi" to these. All are
                             complete except Guide (MDX body in step 4) and About (story,
                             checklist and photos with the standard pages).
content/
  guides/*.mdx               English guides
  hi/guides/*.mdx            Hindi guides (separate files, written not translated)
lib/
  content.ts                 Hand-authored copy per language: homepage blocks, circle-rate explainer
  faq.ts                     Generated Q&As for locality and circle-rate pages
  geo.ts                     Distance and footprint centroid, computed at build
  labels.ts                  Display labels for enum values in both languages
data/*.json                  All entity data (see below)
docs/BUILD-SPEC.md           Build spec
lib/
  schemas.ts                 Zod schema for every data file and for guide frontmatter
  integrity.ts               Cross-file checks: unique ids, foreign keys, reserved slugs
  guards.ts                  Thin-page guard for localities
  data.ts                    Typed loaders: getCities(), getLocalities(), getProjects(), ...
  guide-files.ts             Reads and checks MDX frontmatter (no data.ts dependency)
  guides.ts                  getGuides(locale), getGuide(locale, slug)
  routes.ts                  generateStaticParams sources and cross-tree language links
  i18n.ts                    Locale helpers and interface labels
scripts/
  validate.ts                npm run validate
```

Locale comes only from which tree a route file sits in. There is no middleware, no cookie read and no browser-language redirect.

## Data files

Every record carries `sources[]` (`{label, url, accessedAt}`, at least one, https only) and `updatedAt` (`YYYY-MM-DD`). An optional `todo[]` marks open items on seed or placeholder data; validation passes but prints each one as a warning.

| File | What it holds |
| --- | --- |
| `data/cities.json` | One record per city: names in both scripts, centre point, intro, broker note, and the anchor points (temple, airport, station, roads) that drive times are measured to. |
| `data/localities.json` | One record per locality or village: rates, asking range, land use, drive times, narrative, fit (`{rating, reason, reasonHi}` per use), pros/cons/risks, broker note, score. Feeds the locality template. |
| `data/projects.json` | Government projects: agency, status, budget, dates, extent, GeoJSON footprint, affected localities with impact level, dated milestones. |
| `data/circleRates.json` | **Generated** by `npm run rates:derive`. The narrow three-number-per-locality view of each schedule, in the units the government publishes. Old schedules stay for revision history. Do not hand-edit. |
| `data/rates/<city>-<effective>.json` | The full published list: every village row (16 figures each) and every road-segment row, exactly as printed. One file per schedule. Non-agricultural and commercial in ₹/sq m, agricultural in **lakh** ₹/hectare, `null` where the printed cell is empty. |
| `data/rates/indexable.json` | Village rate-page ids opened to search beyond those a live locality references. Widen in batches while watching Search Console. |
| `data/tehsils.json` | One record per tehsil: names in both scripts and its sub-registrar office, which is the unit a rate list is published and cited under. |
| `data/units.json` | The local bigha in sq m, with its source. Display conversion only; nothing converted is ever stored. |
| `data/valuationRules.json` | The list's general instructions as data: percentage, instruction number and description per rule. Marked `TODO legal-review`; the calculator that reads it is an estimate. |
| `data/stampDutyRules.json` | Stamp duty %, registration fee % and cap, and rebate per buyer category (male / female / joint) for UP. |
| `data/updates.json` | Dated archive entries for notices, gazettes, RERA updates, circle-rate revisions and project announcements, with linked cities, localities and projects. |
| `data/priceObservations.json` | Dated asking-price ranges per locality (broker / listing / registry). Feeds the price trend charts. |
| `data/team.json` | Broker and team: names, RERA number and record URL, years active, phone, WhatsApp, photo, bio. The first record is the broker shown site-wide. |
| `data/scoring.json` | The six weights of the high-potential score. Must sum to 100. |

Guide frontmatter (`title, summary, slug, lang, author, publishedAt, updatedAt, cityIds, tags, faq, heroImage, pairedSlug`) is validated by the same run. The file name must equal `slug`, `lang` must match the tree, `author` must be a `team.json` id or `wwiser`, and `pairedSlug` must exist in the other tree.

## How to add a locality

1. Add a record to `data/localities.json`. Use a stable, lowercase, hyphenated English `id`; it becomes the URL slug and never changes, even if the display name does. `circle-rates` is reserved.
2. Fill at least the **minimum field set**, or the page is not built: `name`, `cityId`, `lat` and `lng`, a circle rate (either `circleRate` or at least one `rateRefs` entry), `landUse`, and at least one paragraph in `narrative.drivers`. The Hindi page also needs `nameHi` and at least one paragraph in `narrative.driversHi`.
3. Keys in `driveTimes` must be anchor ids from that city in `data/cities.json`.
4. Add at least one entry to `sources[]` and set `updatedAt`.
5. Point the locality at the published list: add its row ids to `scripts/rate-aliases.json` and re-run `npm run rates:import-list`, which writes `rateRefs`. For a city with no transcribed list yet, set `circleRate` directly instead. Never hand-edit `data/circleRates.json`.
6. Run `npm run validate`. The thin-page guard line shows whether the locality will build in each language and, if not, which fields are missing.
7. Run `npm run build`. Skipped localities are logged as `[thin-page-guard] <locale>: skipped ...`, and they are left out of the pages, the footer index and the circle-rate table links.

Village pages use the same template: set `parentLocalityId` to the parent locality in the same city.
