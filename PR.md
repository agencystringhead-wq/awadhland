# feat/scaffold: repo scaffold (build order step 1)

## Summary

Step 1 of the build order in `docs/BUILD-SPEC.md`: a Next.js 15 static export with Zod-validated data, two locale route trees, typed component stubs and Ayodhya seed data. Every seed route builds to static HTML in both English and Hindi.

## What's in it

- **Stack:** Next.js 15.5, React 19, TypeScript (strict), Tailwind 4. `output: 'export'`, `trailingSlash: true`. No server routes, ISR, middleware or runtime fetching. `.nvmrc` and `engines` pin Node 20.
- **Data:** nine files in `/data`, one Zod schema each in `lib/schemas.ts`.
  - `lib/data.ts` has typed loaders (`getCities()`, `getLocalities()`, `getProjects()`, `getCurrentCircleRateSchedule()`, `getUpdates()`, `getBroker()`, ...). They parse every file on import and run cross-file integrity checks, so a bare `next build` also fails on bad data.
  - `lib/integrity.ts` catches what per-file schemas can't: duplicate ids, unknown foreign keys (cityId, localityId, projectId, parentLocalityId, driveTimes anchors), impacts outside `affectedLocalityIds`, duplicate schedules, and reserved URL slugs (a city called `projects`, a locality called `circle-rates`).
- **`npm run validate`** (`scripts/validate.ts`):
  - Reads every file from disk, so malformed JSON is reported per file.
  - Runs the schemas, then the integrity checks, then guide frontmatter.
  - Reports the thin-page guard result per locale and prints open `todo[]` items as warnings.
  - Exits 1 on any error and fails on any `/data/*.json` file that has no registered schema.
  - Wired into `prebuild`.
- **Thin-page guard** (`lib/guards.ts`): a locality builds only with name, cityId, lat/lng, circleRate, landUse and at least one `narrative.drivers` paragraph. Hindi also needs `nameHi` and `narrative.driversHi`. Skipped ids are logged at build as `[thin-page-guard] <locale>: skipped ...` and left out of `generateStaticParams`, the footer index and the circle-rate table links.
- **Content:** one sample guide in each of `content/guides/` and `content/hi/guides/`, with Template 6 frontmatter.
  - The file name must match `slug`.
  - `lang` must match the tree.
  - `author` must be a team id or `wwiser`.
  - `pairedSlug` must exist in the other tree.
- **Routes:** `app/(en)/**` and `app/hi/**`, each a thin wrapper that passes `locale` to a shared template in `components/templates/`. Locale comes from the tree only.
  - The language toggle links to the same page in the other tree. When that page doesn't exist (a guide with no pair, or a locality that fails the Hindi guard), it links to the other tree's city hub and shows a one-line notice, per spec.
- **Components:** typed stubs for all 19 rows of the spec's Shared components table (25 components, since four rows name more than one). Six of them are the Template 9 trust components: `TrustBar`, `BrokerCard`, `WhyWeExist`, `HowWeWork`, `Reviews`, `Badges`. No styling. `/about/` and `/hi/about/` render the trust components from `team.json`.
- **Seed data (Ayodhya):**
  - 1 city.
  - 2 localities: `faizabad-road`, `civil-lines`.
  - 1 project: `ayodhya-airport-expansion`.
  - 1 circle-rate schedule covering both localities.
  - 1 update and 1 price observation.
  - 3 stamp-duty rules (male / female / joint, placeholders).
  - 1 broker with placeholder name, RERA number and phone.
  - Scoring with the six spec weights (25/20/20/15/10/10, litigation negative).
  - Every record has `sources[]`, `updatedAt` and `todo[]`.

## Routes built

```
/                                           /hi/
/ayodhya/                                   /hi/ayodhya/
/ayodhya/faizabad-road/                     /hi/ayodhya/faizabad-road/
/ayodhya/civil-lines/                       /hi/ayodhya/civil-lines/
/ayodhya/circle-rates/                      /hi/ayodhya/circle-rates/
/projects/ayodhya-airport-expansion/        /hi/projects/ayodhya-airport-expansion/
/guides/buy-land-in-ayodhya-as-nri/         /hi/guides/buy-land-in-ayodhya-as-nri/
/updates/                                   /hi/updates/
/updates/2026-09-ayodhya-airport-expansion-tracking/
                                            /hi/updates/2026-09-ayodhya-airport-expansion-tracking/
/about/                                     /hi/about/
```

20 pages plus the 404. First-load JS is 103 kB on every route (the Next/React runtime only).

## How this was tested

- `npm run validate`: PASS on seed data (25 TODO warnings).
- `npm run lint`, `npm run typecheck`, `npm run build`: clean.
- **Corruption tests:** `npm run validate` exited 1 with a readable message for each of 16 cases:
  - truncated JSON and a trailing comma
  - empty `sources`, and missing `updatedAt`
  - an out-of-enum `priceBand`, and an unknown key
  - an impossible date (2023-02-30), and an `http` source URL
  - a circle-rate row pointing at an unknown locality, and a reserved city id
  - an update id whose month doesn't match its date
  - `low > high` on a price observation, a bad phone format, and scoring weights summing to 105
  - a guide `lang` that doesn't match its tree, and an unknown guide author
- **Build-level tests:**
  - `npm run build` on corrupt data stops at prebuild.
  - A bare `next build` on the same corruption fails in the loader.
  - Removing `driversHi` from `civil-lines` builds it in English only. The skip is logged, the Hindi footer and table don't link it, and the English toggle falls back to `/hi/ayodhya/` with the notice.
  - Making every Hindi locality thin fails with a clear "has no pages to build" error. Without that, Next's empty-params behaviour produces a misleading "missing generateStaticParams" message.
- `out/` checked: `<html lang="en-IN">` in `app/(en)`, `<html lang="hi-IN">` in `app/hi`, and a `SourceStamp` on every data page.

## Deviations and interpretations (please review)

**Environment**
1. **Node 24 locally.** This machine has Node 24.15, not 20. `.nvmrc` and `engines` pin 20; please confirm on a Node 20 build (Cloudflare `NODE_VERSION=20`).
2. **`Docs/` renamed to `docs/`** to match the path in CLAUDE.md. Cloudflare's Linux build is case-sensitive.
3. **Two root layouts, no `app/layout.tsx`.** This is what lets `<html lang>` be set per tree at build time without reading anything at runtime. Side effects:
   - The default `404.html` has no `lang` attribute (the 404 page is a later standard page).
   - Switching trees is a full page load.
4. **No `main` branch exists yet.** The directory wasn't a git repo and `gh` isn't installed. I ran `git init` and committed only on `feat/scaffold`; nothing was pushed. Opening this PR into `main` needs a `main` on GitHub first. How to create it (for example an empty initial commit) is your call, given the no-direct-commits rule.

**Data model.** The spec lists field names but not types, so these are interpretations:
5. **File shapes.** Files are arrays of records, except `scoring.json`, which is a single object. `stampDutyRules.json` has one record per buyer category.
6. **Multi-paragraph fields** (`project.description`, `update.summary` and their `Hi` versions) are string arrays, matching `narrative.drivers`.
7. **Fields added beyond the spec's lists:**
   - `todo[]` on every record and in guide frontmatter.
   - `agencyName`, required when `agency` is `other`. The airport is AAI, which isn't in the agency enum.
   - `id` on circle-rate schedules, stamp-duty rules and price observations.
   - `units` on schedules.
   - `effectiveFrom` and `sourceUrl` on each rate row. The Template 5 rules require them, but the field list omits them.
   - `extent` as `{value, unit}`.
   - Hindi variants: `reasonHi`, `textHi`, `prosHi`, `consHi`, `risksHi`.
   - In `scoring.json`: `version`, `maxScore`, and `labelHi` and `direction` per signal.
8. **Enum values I chose:** `priceBand` is low / mid / high / premium, and `landUse` is residential / commercial / mixed / agricultural / industrial / institutional / green-belt / other. The spec only shows `mid` and `residential`.
9. **`sources[]` and `updatedAt` are required on every file**, including stamp-duty rules, team and scoring.
10. **Stricter Hindi guard.** A Hindi locality page also needs `nameHi` and `narrative.driversHi`, so it never shows English copy.
11. **Spec inconsistency on the Hindi narrative field.** Template 3 says `narrativeHi`; the data model says `narrative.driversHi`. I followed the data model.

**Spec gaps that need a decision**
- `fit` holds only a rating, but Template 3 also wants "one line why". There is no field for it.
- There is no reviews data file. `Reviews` receives an empty list and renders nothing.
- `BrokerCard` wants areas covered and a Google rating; `team.json` has neither. Areas are currently passed in from `cities.json`.
- Guides have no `sources[]`, so guide pages have no `SourceStamp`. CLAUDE.md requires it on data pages only.

**Deferred to later build steps**
- Fonts (step 2). The 16px English and 17px Hindi body sizes are already set.
- Styling, Leaflet and the map (step 2).
- MDX body rendering and the read-time count (step 4).
- Calculator logic (step 5).
- Metadata, per-language titles, hreflang tags, JSON-LD, sitemaps and llms.txt (step 6).
- JotForm (step 7).
- The `lang` cookie from the spec's URL rules.
- `scripts/parse-circle-rates.ts`.
- Links for the Circle rates, Guides and Tools header items, which have no index routes yet.

## Seed data is not launch data

- All figures are illustrative.
- Source URLs point at portal home pages.
- `accessedAt` dates are placeholders.
- Broker, RERA and phone values are placeholders.
- Stamp-duty percentages are unconfirmed.

Each of these is flagged in the record's `todo[]` and listed on every validate run.

Hindi seed copy was drafted by a model and is flagged for a person to rewrite. Trust-block Hindi copy (`TrustBar`, `WhyWeExist`, `HowWeWork`) is left as TODO rather than machine-translated, per Template 9.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
