# awadhland.com

Land-buying authority site for Ayodhya, Lucknow and Gorakhpur. Static Next.js export deployed to Cloudflare Pages.

`docs/BUILD-SPEC.md` is the source of truth for templates, URLs, data model, components and SEO. `CLAUDE.md` has the house rules. Change the spec first, then the code.

## Quick start

Node 20 (`.nvmrc`).

```bash
npm install
npm run validate   # schemas + cross-file checks + guide frontmatter; exits 1 on any error
npm run build      # runs validate first (prebuild), then next build → static site in out/
npm run dev        # local dev server
npm run typecheck
```

A failing validation is a build failure. The loaders in `lib/data.ts` also validate on import, so a bare `next build` fails on bad data too.

## Folder structure

```
app/
  globals.css
  (en)/                      English tree, served at the root. Own root layout: <html lang="en-IN">
    layout.tsx
    page.tsx                 /
    [city]/page.tsx          /ayodhya/
    [city]/[locality]/       /ayodhya/faizabad-road/        (thin-page guard applied)
    [city]/circle-rates/     /ayodhya/circle-rates/
    projects/[slug]/         /projects/ayodhya-airport-expansion/
    guides/[slug]/           /guides/buy-land-in-ayodhya-as-nri/
    updates/                 /updates/
    updates/[slug]/          /updates/2026-09-.../
    about/                   /about/
  hi/                        Hindi tree, same paths under /hi/. Own root layout: <html lang="hi-IN">
components/
  *.tsx                      Shared component stubs from the spec (Header, LeadForm, SourceStamp, ...)
                             plus the six trust components (TrustBar, BrokerCard, WhyWeExist,
                             HowWeWork, Reviews, Badges)
  templates/                 One template per page type. Route files in both trees are thin
                             wrappers that pass locale="en" or locale="hi" to these.
content/
  guides/*.mdx               English guides
  hi/guides/*.mdx            Hindi guides (separate files, written not translated)
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
| `data/localities.json` | One record per locality or village: rates, asking range, land use, drive times, narrative, fit, pros/cons/risks, broker note, score. Feeds the locality template. |
| `data/projects.json` | Government projects: agency, status, budget, dates, extent, GeoJSON footprint, affected localities with impact level, dated milestones. |
| `data/circleRates.json` | One object per published circle-rate schedule per city, rates in the units the government publishes. Old schedules stay for revision history. |
| `data/stampDutyRules.json` | Stamp duty %, registration fee % and cap, and rebate per buyer category (male / female / joint) for UP. |
| `data/updates.json` | Dated archive entries for notices, gazettes, RERA updates, circle-rate revisions and project announcements, with linked cities, localities and projects. |
| `data/priceObservations.json` | Dated asking-price ranges per locality (broker / listing / registry). Feeds the price trend charts. |
| `data/team.json` | Broker and team: names, RERA number and record URL, years active, phone, WhatsApp, photo, bio. The first record is the broker shown site-wide. |
| `data/scoring.json` | The six weights of the high-potential score. Must sum to 100. |

Guide frontmatter (`title, summary, slug, lang, author, publishedAt, updatedAt, cityIds, tags, faq, heroImage, pairedSlug`) is validated by the same run. The file name must equal `slug`, `lang` must match the tree, `author` must be a `team.json` id or `wwiser`, and `pairedSlug` must exist in the other tree.

## How to add a locality

1. Add a record to `data/localities.json`. Use a stable, lowercase, hyphenated English `id`; it becomes the URL slug and never changes, even if the display name does. `circle-rates` is reserved.
2. Fill at least the **minimum field set**, or the page is not built: `name`, `cityId`, `lat` and `lng`, `circleRate`, `landUse`, and at least one paragraph in `narrative.drivers`. The Hindi page also needs `nameHi` and at least one paragraph in `narrative.driversHi`.
3. Keys in `driveTimes` must be anchor ids from that city in `data/cities.json`.
4. Add at least one entry to `sources[]` and set `updatedAt`.
5. Add the locality's row to the current schedule in `data/circleRates.json` (same `localityId`, with its own `effectiveFrom` and `sourceUrl`). If a new schedule was published, add a new schedule object instead of editing the old one.
6. Run `npm run validate`. The thin-page guard line shows whether the locality will build in each language and, if not, which fields are missing.
7. Run `npm run build`. Skipped localities are logged as `[thin-page-guard] <locale>: skipped ...`, and they are left out of the pages, the footer index and the circle-rate table links.

Village pages use the same template: set `parentLocalityId` to the parent locality in the same city.
