# Awadhland.com — Page-Type Inventory & Build Spec

As of 2026-09-23. Source of truth for structure, templates, data model and SEO. Change this file first, then the code.

## Overview

awadhland.com is a land-buying authority site for Ayodhya, Lucknow and Gorakhpur, built to rank for informational and transactional land queries and convert readers into WhatsApp/phone leads for a UP RERA-registered broker. Eight page templates cover every page on the site; four of them render from JSON so adding Varanasi or Prayagraj later is a content job, not a build job.

**Locked decisions**

- One domain: awadhland.com. awadhland.in 301-redirects to .com.
- Ayodhya is the hero city; Lucknow and Gorakhpur are full sections with the same templates.
- Two languages, English and Hindi, on separate URL trees with hreflang. No runtime translation, no auto-redirect by browser language.
- Stack: Next.js static export (`output: 'export'`), Node 22, Cloudflare Pages, GitHub under agencystringhead-wq, feature branches + PRs into main.
- Content lives in `/data` as JSON (entities) and `/content` as MDX (guides, tools copy). No CMS at launch.
- Every data point carries a `source` URL and `updatedAt` date, rendered on the page.
- Lead capture: JotForm via Cloudflare Worker proxy (existing pattern), plus WhatsApp deep link and tel: link in a sticky header.
- Media on Cloudflare R2. Images re-encoded to ~60–115 KB at q90 before commit.

## URL structure and language

English lives at the root; Hindi lives under `/hi/` with identical paths. Every page pair links to each other with hreflang `en-IN` and `hi-IN`, plus `x-default` pointing at English.

| Page type | English URL | Hindi URL |
| --- | --- | --- |
| Homepage | `/` | `/hi/` |
| City hub | `/ayodhya/` | `/hi/ayodhya/` |
| Locality | `/ayodhya/faizabad-road/` | `/hi/ayodhya/faizabad-road/` |
| Circle rates | `/ayodhya/circle-rates/` | `/hi/ayodhya/circle-rates/` |
| Circle rates by tehsil | `/ayodhya/circle-rates/sadar/` | `/hi/ayodhya/circle-rates/sadar/` |
| Circle rate by village | `/ayodhya/circle-rates/sadar/sahadatganj/` | `/hi/ayodhya/circle-rates/sadar/sahadatganj/` |
| Project | `/projects/ayodhya-greenfield-township/` | `/hi/projects/ayodhya-greenfield-township/` |
| Guide | `/guides/buy-land-in-ayodhya-as-nri/` | `/hi/guides/buy-land-in-ayodhya-as-nri/` |
| Tool | `/tools/stamp-duty-calculator/` | `/hi/tools/stamp-duty-calculator/` |
| Updates archive | `/updates/` | `/hi/updates/` |
| Update entry | `/updates/2026-09-uprera-ayodhya-listing/` | `/hi/updates/2026-09-uprera-ayodhya-listing/` |

**Rules**

- Slugs are English transliterations in both trees (`faizabad-road`, not Devanagari in URLs). Simpler to share, type and log.
- Locality slugs are stable IDs. Renaming a locality changes its display name, never its slug.
- Language toggle in the header: shows "हिंदी" on English pages and "English" on Hindi pages. It links to the same page in the other tree. If the Hindi page does not exist yet, link to the Hindi city hub and show a one-line notice.
- Remember the choice in a cookie (`lang=hi`) so internal links keep the user in their tree. Never redirect based on browser language or IP.
- `<html lang>` switches per tree. Hindi pages load Noto Sans Devanagari, body size 17px vs 16px for English. Same layout, same components, same colours.
- Two sitemaps (`sitemap-en.xml`, `sitemap-hi.xml`) under one index. Titles and meta descriptions are written separately per language, not translated.
- Trailing slashes on all URLs. Lowercase only. Redirect any uppercase or non-slash variant.

## Template 1: Homepage

Hand-authored page with data blocks pulled in at build time. One route, two languages.

| # | Section | Content | Data source |
| --- | --- | --- | --- |
| 1 | Sticky header | Logo, nav (Ayodhya · Lucknow · Gorakhpur · Circle rates · Guides · Tools · Updates), language toggle, WhatsApp + Call buttons | static |
| 2 | Hero | Headline, one-line promise, counters (cities, localities covered, projects tracked, circle-rate entries, last updated), primary CTA "Talk to us on WhatsApp" | counters computed from `/data` |
| 3 | What changed | Dated strip of the 3 latest updates (circle rate revision, master plan notice, project clearance), each linking to its archive entry | `updates.json`, newest 3 |
| 4 | City cards | Three cards, Ayodhya first and larger: price band, locality count, top 3 high-potential areas, link to hub | `cities.json`, `localities.json` |
| 5 | Your situation | Six cards: Buying from abroad (NRI) · First plot in Ayodhya · Commercial land near the airport · Investment under 25 lakh · Agricultural to residential · Not sure yet. Each links to a guide and ends in a CTA | static, links to guides |
| 6 | Free tools | Stamp duty calculator, circle rate lookup, land safety checklist, plot yield calculator | static |
| 7 | Before you pay a rupee | Six-point checklist: khatauni, encumbrance, mutation, master-plan land use, Gram Sabha / ceiling land, RERA for plotted projects. Links to full guide | static |
| 8 | Broker card | Photo, name, "UP RERA registered agent · 12 years in Ayodhya", RERA number, WhatsApp, call | `team.json` |
| 9 | Latest guides | Four newest guides with date and read time | MDX frontmatter |
| 10 | Lead form | Name, phone, city (select), budget band (select), purpose (residential / commercial / investment / not sure), location (India / outside India), message | JotForm via Worker |
| 11 | Footer | Full index: every city and locality link, guides, tools, legal, RERA disclosure | `localities.json` |

**Behaviour**

- Counters and "what changed" regenerate on every build; no client-side fetching.
- WhatsApp button opens `wa.me/<number>?text=` with a prefilled message naming the page the user came from.
- Hero image and city card images served from R2 as WebP, with AVIF where supported.

## Template 2: City hub

One per city (`/ayodhya/`, `/lucknow/`, `/gorakhpur/`). Hand-authored intro and broker note; everything else renders from data filtered by `cityId`.

| # | Section | Content | Data source |
| --- | --- | --- | --- |
| 1 | Hero | City name in both scripts, one-paragraph market read, price band range (₹/sq ft low to high), counters (localities, projects, RERA projects) | `cities.json`, computed |
| 2 | Locality map | Interactive map, one marker per locality, coloured by price band, click opens a card with rate + link. Leaflet + OpenStreetMap tiles, no Google Maps key | `localities.json` (lat/lng) |
| 3 | High-potential areas | Ranked list of top 10 localities with the score visible and a one-line reason. Links to methodology page | `localities.json` (`score`) |
| 4 | Government projects | Card grid of projects in this city: name, agency, status chip, one-liner | `projects.json` |
| 5 | Circle rates | Summary table: top 10 localities by rate, effective date, link to full circle-rate page | `circleRates.json` |
| 6 | Price trend | Line chart of median asking rate over time, from the site's own dated observations. Starts as a short series; grows with each refresh | `priceObservations.json` |
| 7 | Broker note | Dated paragraph from the broker on the city, in his voice | `cities.json` (`brokerNote`) |
| 8 | Guides for this city | Guides tagged with `cityId` | MDX frontmatter |
| 9 | Recent updates | Last 5 archive entries tagged with `cityId` | `updates.json` |
| 10 | All localities | Alphabetical link grid, grouped by tehsil or zone | `localities.json` |
| 11 | Lead form | Prefilled with city | JotForm |

**High-potential score (published on `/methodology/`)**

Score out of 100, recomputed at build: connectivity to anchors 25 · master-plan land use 20 · price momentum 20 · government project proximity 15 · RERA coverage 10 · litigation/dispute risk 10 (negative). Weights live in `scoring.json` so they can be tuned without code changes. The methodology page explains each signal in plain language.

## Template 3: Locality page

The workhorse. Fully data-driven from one record in `localities.json`; no hand-authored copy except the broker note and the narrative fields inside the record. This is where most of the 1000+ pages live, from major localities down to village level.

| # | Section | Content | Field(s) |
| --- | --- | --- | --- |
| 1 | Header | Name in Latin and Devanagari, tehsil, pin code, price band chip, breadcrumb (Home › City › Locality) | `name`, `nameHi`, `tehsil`, `pincode`, `priceBand` |
| 2 | Key facts table | Circle rate (residential / commercial / agricultural, ₹ per sq m, effective date, source link), market asking range, land use per master plan, RERA projects within 3 km | `circleRate`, `askingRange`, `landUse`, `reraNearby` |
| 3 | Distances | Table of distance and drive time to city anchors: Ayodhya = Ram Mandir, airport, Ayodhya Dham station, ring road, NH-27; Lucknow = Shaheed Path, airport, Charbagh, Gomti Nagar, outer ring road; Gorakhpur = AIIMS, airport, railway station, Fertilizer belt, NH-28. Computed once at build from lat/lng, drive times entered manually | `lat`, `lng`, `anchors[]` |
| 4 | Why the price is moving | Two to four paragraphs on drivers: projects, road widening, land-use change, demand type | `narrative.drivers` |
| 5 | Projects nearby | Cards for government projects within 5 km, distance shown | `projects.json` filtered by distance |
| 6 | Who it suits | Three columns: residential, commercial, investment, each with a fit rating (good / mixed / poor) and one line why | `fit.<use>.rating`, `fit.<use>.reason`, `fit.<use>.reasonHi` |
| 7 | Pros and cons | Two short lists | `pros[]`, `cons[]` |
| 8 | Watch-outs | Dispute history, Gram Sabha land presence, ceiling land, flood zone, if known. Rendered only when data exists | `risks[]` |
| 9 | Broker note | Dated, first-person, from the broker | `brokerNote`, `brokerNoteDate` |
| 10 | Nearby localities | Six nearest by distance with price band | computed |
| 11 | FAQ | Four to six Q&As generated from the record (rate, distance to anchor, suitability, RERA), rendered as FAQPage schema | computed from fields |
| 12 | Source and update stamp | "Circle rate from IGRSUP, effective 1 Aug 2026. Page updated 12 Sep 2026." | `sources[]`, `updatedAt` |
| 13 | Lead form | Prefilled with city and locality | JotForm |

**Rules**

- If a field is empty, the section is omitted. No "data not available" rows.
- A locality record with fewer than the minimum fields (name, city, lat/lng, circle rate, land use, at least one narrative paragraph) is not built into a page. This is the guard against thin pages.
- Hindi page reads `nameHi`, `narrativeHi`, `brokerNoteHi`; numeric and tabular fields are shared.
- Village-level pages under a locality use the same template with `parentLocalityId` set, and add a "Part of" link in the header.

## Template 4: Government project page

One per tracked project (`/projects/<slug>/`), rendered from `projects.json`. Covers infrastructure, townships, roads, airports, industrial corridors and master-plan zones.

| # | Section | Content | Field(s) |
| --- | --- | --- | --- |
| 1 | Header | Project name, agency (ADA / LDA / GDA / UPEIDA / NHAI / UPSIDA / other), status chip (announced / approved / under construction / partially open / complete / stalled), city | `name`, `agency`, `status`, `cityId` |
| 2 | Fact box | Budget (₹ crore), announced date, expected completion, area (hectares or km), source links | `budgetCr`, `announcedOn`, `expectedCompletion`, `extent`, `sources[]` |
| 3 | What it is | Plain-language description, three to five paragraphs | `description` |
| 4 | Map | Project footprint as a polygon or corridor line over the locality map, with affected localities marked | `geometry` (GeoJSON), `affectedLocalityIds[]` |
| 5 | Effect on land | Table of affected localities with expected effect (strong / moderate / mild) and one-line reason | `impacts[]` |
| 6 | Timeline | Dated milestones from announcement to now, each with source | `milestones[]` |
| 7 | Related updates | Archive entries tagged with this `projectId` | `updates.json` |
| 8 | Related projects | Same city or same agency | computed |
| 9 | Lead form | Prefilled with city and "interested near <project>" | JotForm |

Status is the only field that changes often; it drives the chip colour and the "what changed" strip on the homepage when it moves.

## Template 5: Circle rate page

One per city (`/<city>/circle-rates/`), rendered from `circleRates.json`. The single most-searched data page; keep it fast and printable.

| # | Section | Content | Field(s) |
| --- | --- | --- | --- |
| 1 | Header | City, effective date of the current schedule, source PDF link, revision count | `effectiveFrom`, `sourceUrl` |
| 2 | Calculator | Stamp duty + registration estimator: enter area, select locality and land type, pick buyer category (male / female / joint). Outputs circle value, stamp duty, registration fee, total. Client-side only | `circleRates.json`, `stampDutyRules.json` |
| 3 | Full table | Sortable, filterable by tehsil and land type. Columns: locality, tehsil, residential ₹/sq m, commercial ₹/sq m, agricultural ₹/hectare, effective date, link to locality page | `rates[]` |
| 4 | How circle rates work | Static explainer: what a circle rate is, why market rate differs, how stamp duty is computed on the higher of the two, how often UP revises | MDX |
| 5 | Revision history | Table of past schedules with effective dates and links to archived PDFs | `revisions[]` |
| 6 | FAQ | Schema-marked Q&As | static + computed |
| 7 | Lead form | Prefilled with city | JotForm |

**Rules**

- Rates are stored in the unit the government publishes (₹ per sq m or per hectare) and converted for display. Never store converted values.
- Each rate row carries its own `sourceUrl` and `effectiveFrom`; a schedule revision is a new set of rows, not an overwrite.
- The table paginates at 100 rows server-side at build (static chunks), with client filtering within the chunk.
- Where a city has a full transcribed list in `/data/rates/`, this page also carries the order date, a source link per SRO, the tehsil selector and the district-wide search, and the narrow three-number table covers only the localities carrying `rateRefs`.

## Template 5a: Tehsil rate page

One per tehsil of a published list (`/<city>/circle-rates/<tehsil>/`), rendered from `data/rates/<city>-<effectiveFrom>.json`. The district publishes one list per sub-registrar office, so the tehsil, not the city, is the unit a reader actually looks things up in.

| # | Section | Content | Data source |
| --- | --- | --- | --- |
| 1 | Header | Tehsil name, SRO, effective date, village count, road-segment count, link to the source document | `tehsils.json`, `rates/*.json` |
| 2 | Village table | Every row of the tehsil, columns switchable between Land (`<9 m` / `9–18 m` / `18 m+`), Commercial (shop / office / godown) and Agricultural (six frontage columns). Filter by category and ward, sort by any column. Each row links to its village page | `rates/*.json` `rows[]` |
| 3 | All villages | Every village as a plain link, A–Z, server-rendered | `rates/*.json` `rows[]` |
| 4 | Road segments | The tehsil's `प्रारूप-3` stretches with their land and shop rates, each linked to the village row it resolves to | `rates/*.json` `roadSegments[]` |
| 5 | Valuation rules | The list's general instructions as cards, each with its instruction number and percentage | `valuationRules.json` |
| 6 | Lead form | Prefilled with city and tehsil | JotForm |

**Rules**

- The table prerenders 100 rows and loads the rest from `public/rates/<city>-<tehsil>.json` on the first sort, filter or "show all". Section 3 is not paginated, so the link graph into the village pages never depends on JavaScript.
- Every table carries its own source line: "IGRSUP list, `<SRO>`, effective `<date>`, printed page `<N>`". The five SROs publish separately and must never be merged into one citation.
- Always indexable.

## Template 5b: Village rate page

One per row of a published list (`/<city>/circle-rates/<tehsil>/<village-slug>/`). Roughly 1,630 per language for Ayodhya alone, so the indexing rule below matters more than the template.

| # | Section | Content | Field(s) |
| --- | --- | --- | --- |
| 1 | Header | Name in both scripts, tehsil, ward or pargana, category, printed serial and V-code | `nameEn`, `nameHi`, `wardHi`, `category`, `serial`, `vcode` |
| 2 | Rates | All 16 figures in three small tables: land by road width, commercial by type, agricultural by frontage with a ₹/sq m and ₹/bigha conversion line | `nonAgri`, `commercial`, `agriLakhPerHa` |
| 3 | Road stretches | Segments passing through this village | `roadSegments[]` where `rateRowId` matches |
| 4 | Worked example | A 1,000 sq ft plot on a road under 9 m: circle value, stamp duty for a male and a female buyer | computed |
| 5 | Calculator | The stamp duty estimator prefilled with this row and its segments | `valuationRules.json`, `stampDutyRules.json` |
| 6 | Comparison | The row against the tehsil median, as a percentage | computed |
| 7 | Similar villages | Six nearest rows in the same tehsil by rate similarity | computed |
| 8 | Covered by | Any site locality whose `rateRefs` include this row | `localities.json` |
| 9 | Source stamp and lead form | Printed page named; form prefilled with city and village | `sources[]`, JotForm |

**Indexing rule**

Every village page builds in both trees. A page is indexable only when a **live** locality references its row through `rateRefs`, or its row id is listed in `data/rates/indexable.json`. Everything else ships `noindex, follow` and is absent from the sitemaps and `llms.txt`. The list is widened in batches while watching Search Console; it is not a backlog to clear.

## Template 6: Guide

Long-form article template (`/guides/<slug>/`) for buying guides, legal checks, investment analysis and comparison pieces. Written as MDX with frontmatter; a Hindi guide is a separate MDX file under `/content/hi/guides/`.

| # | Section | Content | Source |
| --- | --- | --- | --- |
| 1 | Header | Title, one-line summary, author (broker or wwiser), published and updated dates, read time, city tags | frontmatter |
| 2 | Table of contents | Auto-generated from H2s, sticky on desktop | computed |
| 3 | Body | MDX with access to data components: `<CircleRate locality="…" />`, `<Distance from="…" to="…" />`, `<ProjectCard id="…" />`, `<Callout>`, `<Checklist>` | MDX |
| 4 | Mid-article CTA | After the second H2: one-line broker offer with WhatsApp button | component |
| 5 | FAQ | Q&As from frontmatter, rendered as FAQPage schema | frontmatter |
| 6 | Author box | Broker photo, RERA number, one line; or wwiser editorial byline | `team.json` |
| 7 | Related guides | Three, by shared tags | computed |
| 8 | Lead form | Prefilled with city tag if present | JotForm |

**Frontmatter fields**

`title`, `summary`, `slug`, `lang`, `author`, `publishedAt`, `updatedAt`, `cityIds[]`, `tags[]`, `faq[]`, `heroImage`, `pairedSlug` (the matching guide in the other language).

**Launch guide list (20, English first, Hindi for the starred ones)**

1. How to buy land in Ayodhya as an NRI ★
2. How to buy a plot in Ayodhya: step-by-step ★
3. Ayodhya vs Lucknow vs Gorakhpur for land investment ★
4. Circle rate vs market rate in UP explained ★
5. Stamp duty and registration charges in UP 2026 ★
6. How to check if land in UP is safe to buy: khatauni, encumbrance, mutation ★
7. Gram Sabha land, ceiling land and other things you cannot legally buy ★
8. Ayodhya master plan 2031: what it means for buyers
9. Land near Ayodhya airport: what is actually available
10. 14 Kosi and 84 Kosi parikrama corridor: land guide
11. Commercial land in Ayodhya: hotels, dharamshalas, retail
12. Agricultural to residential conversion in UP (Section 80)
13. Lucknow: Sultanpur Road, Shaheed Path and the outer ring road
14. Lucknow plots under 30 lakh: where to look
15. Gorakhpur land guide: AIIMS, GIDA and the Fertilizer belt
16. UP RERA for plotted developments: what registration covers
17. Power of attorney and buying land from abroad
18. Land registry process in UP: from agreement to mutation
19. Common land frauds in Ayodhya and how to avoid them
20. Ayodhya's land market since 2019: the timeline

## Template 7: Tool

Client-side calculators and checklists at `/tools/<slug>/`. No signup, no server calls. Each tool page has the tool at the top, a 400–800 word explainer under it, an FAQ block and a CTA.

| Tool | What it does | Inputs | Data |
| --- | --- | --- | --- |
| Stamp duty calculator | Circle value, stamp duty, registration fee and total for a UP land purchase | City, locality, land type, area, buyer category (male / female / joint) | `circleRates.json`, `stampDutyRules.json` |
| Circle rate lookup | Type a locality, get its current rates and effective date | Locality search (fuzzy, both scripts) | `circleRates.json` |
| Land safety checklist | Interactive checklist with explanations; prints or saves as PDF | Checkbox per item, optional notes | static |
| Plot yield calculator | Compare a plot purchase against FD returns over 5 / 10 years using the user's own growth assumption | Price, area, expected annual growth %, holding period | static |

**Rules**

- Every tool renders correctly with JavaScript off: a static explainer and a link to the relevant data page. The interactive part enhances.
- Results screens carry a "Send this to us on WhatsApp" button that prefills the inputs into the message.
- Tools share one `Calculator` shell component (inputs left, result right on desktop; stacked on mobile).

## Template 8: Updates archive

Every government notice, gazette, RERA update, circle rate revision and project announcement as a dated entry. Index at `/updates/`, entries at `/updates/<yyyy-mm>-<slug>/`. Rendered from `updates.json`.

**Index page**

| # | Section | Content |
| --- | --- | --- |
| 1 | Header | "Every notice that moves land in Awadh", entry count, last entry date |
| 2 | Filters | City, agency, type (circle rate / master plan / project / RERA / policy / court), year. Client-side over the static list |
| 3 | List | Newest first: date, title, city and agency chips, one-line summary |
| 4 | Subscribe | Email field for a monthly digest (JotForm) |

**Entry page**

| # | Section | Content | Field(s) |
| --- | --- | --- | --- |
| 1 | Header | Title, date, agency, type chip, city chips | `title`, `date`, `agency`, `type`, `cityIds[]` |
| 2 | Source | Link to the original notice or PDF, archived copy on R2 | `sourceUrl`, `archiveUrl` |
| 3 | Plain-language summary | Three to six paragraphs: what it says, who it affects, what changes | `summary` |
| 4 | Affected | Linked localities and projects | `localityIds[]`, `projectIds[]` |
| 5 | Previous and next | Chronological navigation | computed |
| 6 | Lead CTA | "Ask us what this means for your plot" | component |

Entries are also the feed for the homepage "what changed" strip and the per-city and per-project "recent updates" blocks. One entry, three placements.

## Standard pages

| Page | URL | Notes |
| --- | --- | --- |
| About | `/about/` | Full trust page, see Template 9 |
| Broker profile | `/team/<slug>/` | Photo, RERA registration number and link to the UPRERA record, years active, areas covered, WhatsApp and call |
| Methodology | `/methodology/` | The high-potential score explained signal by signal, weights shown, last recomputed date |
| Contact | `/contact/` | Lead form, WhatsApp, call, office address, hours |
| Disclaimer | `/disclaimer/` | Reference not advice; rates change; verify before paying; no guarantee of title; broker relationship disclosed |
| Privacy | `/privacy/` | Form data handling, cookies (only `lang`), no data sold |
| Terms | `/terms/` | Standard |
| Sitemap | `/sitemap/` | Human-readable: every city, locality, project, guide, tool and update |
| 404 | — | Search box plus links to the three city hubs |

All standard pages exist in both languages. The disclaimer and RERA disclosure are linked from every footer.

## Template 9: About and trust layer

Trust is built in two places: a set of blocks that repeat across the site, and a full About page at `/about/` (Hindi at `/hi/about/`). Modelled on probate.help, where the named person, licence number, plain-English promise and third-party reviews all sit on the homepage, and the About page goes deeper.

**Trust blocks (shared components, used on homepage, city hubs and guides)**

| Block | Content | Placement |
| --- | --- | --- |
| `TrustBar` | One line under the header: "UP RERA registered · 12 years in Ayodhya · Real person on WhatsApp · Every rate sourced" | Homepage, city hubs |
| `BrokerCard` | Photo, name in both scripts, "Your broker", RERA number as a link to the UPRERA record, years active, areas covered, WhatsApp and call, Google rating if 4.5+ | Homepage hero side, city hubs, guides author box |
| `WhyWeExist` | Heading in the broker's voice, then three pillars: **Verified** (every rate, distance and project has a source and date), **Plain** (Hindi and English, no jargon, no pressure), **Local** (native to the region, on the ground every week, will walk the plot with you) | Homepage after "your situation", About page |
| `HowWeWork` | Four numbered steps: 1. A 15-minute WhatsApp or call, you say what you want and your budget · 2. A shortlist with rates, distances and what to check, in writing · 3. Site visit, in person or on video for NRIs, with khatauni and land-use checks done before you travel · 4. Paperwork through registry and mutation, with a written fee agreed up front | Homepage, About page |
| `Reviews` | Google Business Profile rating and count, 4 to 6 named reviews shown as written with date and purpose (bought a plot, NRI purchase, commercial land), link to the full Google profile. Reviews are never edited; the disclaimer states they are collected on Google | Homepage, About page |
| `Badges` | UP RERA number, Google rating, years active, cities covered, any association memberships | Footer band, About page |

**About page (`/about/`)**

| # | Section | Content |
| --- | --- | --- |
| 1 | Hero | Broker photo (real, on site, not studio), name in both scripts, "UP RERA registered land agent · Ayodhya, Lucknow, Gorakhpur", RERA number linked, WhatsApp and call |
| 2 | The story | Four to six short paragraphs in first person: native of the region, 12 years of land work, what changed after 2019, why the site exists (too many buyers, especially from outside UP, getting bad information or bad land), what he refuses to sell |
| 3 | Why we exist | `WhyWeExist` block |
| 4 | How we work | `HowWeWork` block, plus a line on fees: brokerage disclosed in writing before any visit |
| 5 | What we check before you pay | The six-point checklist with one line each: khatauni, encumbrance, mutation, master-plan land use, Gram Sabha or ceiling land, RERA for plotted projects |
| 6 | Who builds the site | Short wwiser section: Stringhead Technologies, Pune, runs the digital side; editorial policy; how data is sourced and refreshed; link to `/methodology/` |
| 7 | Reviews | `Reviews` block |
| 8 | Credentials | `Badges` block, RERA certificate image, link to UPRERA agent search |
| 9 | Photos | Grid of real on-site photos: the broker on plots, with buyers (with consent), registry office. Captioned with locality and month |
| 10 | Lead form | Standard |

**Rules**

- Everything on this page is verifiable or it comes off. RERA number links to the government record. Reviews link to the platform. Years active matches the RERA registration date or earlier proof.
- Broker copy is first person and in his voice, then translated to Hindi by a person, not a model. The Hindi version is likely to be read more than the English one.
- No stock imagery anywhere in the trust layer.
- `Person` JSON-LD for the broker with `sameAs` pointing at the UPRERA record and Google profile; `AggregateRating` only if pulled from a real platform and kept in sync.

## Data model

All entity data lives in `/data/*.json`, validated with Zod at build. A failed validation fails the build. IDs are stable slugs. Every record carries `sources[]` (array of `{label, url, accessedAt}`) and `updatedAt`.

**cities.json**

```json
{
  "id": "ayodhya",
  "name": "Ayodhya", "nameHi": "अयोध्या",
  "district": "Ayodhya", "state": "UP",
  "lat": 26.7922, "lng": 82.1998,
  "intro": "...", "introHi": "...",
  "brokerNote": "...", "brokerNoteHi": "...", "brokerNoteDate": "2026-09-10",
  "anchors": [{ "id": "ram-mandir", "name": "Ram Mandir", "nameHi": "राम मंदिर", "lat": 26.7956, "lng": 82.1943 }],
  "sources": [], "updatedAt": "2026-09-10"
}
```

**localities.json**

```json
{
  "id": "faizabad-road", "cityId": "ayodhya", "parentLocalityId": null,
  "name": "Faizabad Road", "nameHi": "फैजाबाद रोड",
  "tehsil": "Sadar", "pincode": "224001",
  "lat": 26.78, "lng": 82.15,
  "priceBand": "mid",
  "askingRange": { "low": 4500, "high": 9000, "unit": "sqft", "asOf": "2026-09-01" },
  "circleRate": { "residential": 12000, "commercial": 24000, "agricultural": 4500000, "unit": "sqm|hectare", "effectiveFrom": "2026-08-01", "sourceUrl": "..." },
  "landUse": "residential", "landUseSource": "ADA Master Plan 2031",
  "driveTimes": { "ram-mandir": 18, "airport": 25 },
  "narrative": { "drivers": ["..."], "driversHi": ["..."] },
  "fit": {
    "residential": { "rating": "good", "reason": "...", "reasonHi": "..." },
    "commercial": { "rating": "mixed", "reason": "...", "reasonHi": "..." },
    "investment": { "rating": "good", "reason": "...", "reasonHi": "..." }
  },
  "pros": [], "cons": [], "risks": [],
  "brokerNote": "...", "brokerNoteHi": "...", "brokerNoteDate": "2026-09-10",
  "score": 72,
  "sources": [], "updatedAt": "2026-09-10"
}
```

**projects.json** — `id`, `cityId`, `name`, `nameHi`, `agency`, `status`, `budgetCr`, `announcedOn`, `expectedCompletion`, `extent`, `description`, `descriptionHi`, `geometry` (GeoJSON), `affectedLocalityIds[]`, `impacts[]` (`{localityId, level, reason}`), `milestones[]` (`{date, text, sourceUrl}`), `sources[]`, `updatedAt`.

**circleRates.json** — `cityId`, `effectiveFrom`, `sourceUrl`, `archiveUrl`, `rates[]` (`{localityId, tehsil, residential, commercial, agricultural}`). One object per schedule; old schedules are kept for the revision history. **Generated**, not hand-edited: `npm run rates:derive` rebuilds it from `/data/rates/` for every city that has a transcribed list, and leaves the seed schedules of cities that do not. Derivation is `residential = nonAgri.lt9m`, `commercial = commercial.shop`, `agricultural = agriLakhPerHa.general × 100000`, taking the highest of each column where a locality spans several rows.

**tehsils.json** — `id`, `cityId`, `name`, `nameHi`, `sroName`, `sroNameHi`, `lat`, `lng`, `sources[]`, `updatedAt`. The sub-registrar office is the unit a rate list is published and cited under, so it is a first-class entity rather than the free-text `tehsil` string on a locality.

**data/rates/`<city>`-`<effectiveFrom>`.json** — the full published list, one file per schedule so a revision is a new file and never an overwrite.

```json
{
  "cityId": "ayodhya",
  "effectiveFrom": "2025-06-07",
  "orderDate": "2025-06-06",
  "sourceDocs": [{ "sro": "sadar", "pdfPath": "…", "archiveUrl": null, "igrsupUrl": "https://igrsup.gov.in/" }],
  "rows": [{
    "id": "sadar-s517", "sro": "sadar", "page": "100", "serial": 517, "vcode": null,
    "nameHi": "सहादतगंज", "nameEn": "Sahadatganj", "slug": "sahadatganj",
    "wardHi": "सहादतगंज", "category": "urban",
    "nonAgri": { "lt9m": 10500, "m9to18": 11500, "ge18m": 12300 },
    "commercial": { "shop": 49200, "office": 45200, "godown": 41100 },
    "agriLakhPerHa": { "nh": null, "state": null, "link": null, "chakmarg": null, "abadi": null, "general": null },
    "note": null
  }],
  "roadSegments": [{ "id": "sadar-seg5-sahadatganj", "sro": "sadar", "page": "67", "segmentHi": "…", "segmentEn": "…", "villageHi": "सहादतगंज", "rateRowId": "sadar-s517", "nonAgri": 33200, "shop": 77400, "office": 74000, "godown": 70600, "note": null }]
}
```

Units are exactly as published and are never converted in storage: `nonAgri.*` and `commercial.*` in ₹ per sq m, `agriLakhPerHa.*` in **lakh** ₹ per hectare, `null` where the printed row leaves the cell empty. `note` carries the transcriber's flag on an oddly printed row and is never rendered. Row ids are `${sro}-${vcode || 's'+serial}`; slugs are unique within a tehsil, with the ward or V-code appended when two rows share a name.

**data/rates/indexable.json** — `rateRowIds[]`, the village rows opened to search beyond those a live locality references. See Template 5b.

**units.json** — `sqmPerHectare`, and the local `bigha` with its size in sq m, its label and its source. Display conversions only; nothing converted is ever stored.

**valuationRules.json** — `effectiveFrom`, `largePlotThresholdSqm`, `largePlotPct`, and `rules[]` (`{id, instruction, applies, pct, label, labelHi, description, descriptionHi}`) transcribed from the list's general-instruction pages. Carries `TODO legal-review`: the calculator that reads it is an estimate, and the file says so.

**localities.json additions** — `rateRefs[]` (`{rateRowId}`) and `roadSegmentRefs[]` (`{id}`) point into the published list. A locality may span several rows, so pages show the range. `circleRate` remains optional for cities whose list is not transcribed yet, and the thin-page guard accepts either.

**stampDutyRules.json** — per buyer category: stamp duty %, registration fee % and cap, any rebate, `effectiveFrom`, `sourceUrl`.

**updates.json** — `id`, `date`, `title`, `titleHi`, `agency`, `type`, `cityIds[]`, `localityIds[]`, `projectIds[]`, `summary`, `summaryHi`, `sourceUrl`, `archiveUrl`.

**priceObservations.json** — `localityId`, `date`, `low`, `high`, `unit`, `source` ("broker" | "listing" | "registry"). Feeds the trend charts. Starts small.

**team.json** — `id`, `name`, `nameHi`, `role`, `reraNumber`, `reraUrl`, `yearsActive`, `phone`, `whatsapp`, `photo`, `bio`, `bioHi`.

**scoring.json** — the six weights for the high-potential score.

A `scripts/parse-circle-rates.ts` and `scripts/validate.ts` live alongside; parsing scripts take a PDF-to-CSV export as input and emit JSON. Nothing scrapes live sites at build.

**Importing a published rate list**

```
npm run rates:import-list -- --city ayodhya --effective 2025-06-07 --order-date 2025-06-06 \
  --dir data/sources/circle-rates/ayodhya/transcribed-2025-06-07 [--dry-run]
```

Reads every `*-p4.csv` (village rows) and `*-p3.csv` (road segments) in the directory, normalises the categories, derives `nameEn` and `slug` (`lib/devanagari.ts`, overridden by `scripts/name-overrides.json`), writes `data/rates/<city>-<effectiveFrom>.json`, and sets `rateRefs` on the localities it can match. Matching is: `scripts/rate-aliases.json`, then exact Hindi name, then normalised Hindi. Always run `--dry-run` first: it reports rows per SRO, matched and unmatched localities with candidate ids, unmatched road segments and slug collisions, and writes nothing.

`npm run rates:derive` then regenerates `circleRates.json`, and `npm run rates:chunks` writes the per-tehsil search chunks into `public/rates/`. Both run in `prebuild`, so a stale derived file cannot ship.

The scanned source PDFs are gitignored; `sourceDocs[].pdfPath` records provenance and `archiveUrl` points at the R2 copy.

## Shared components

| Component | Used on | Notes |
| --- | --- | --- |
| `Header` | all | Sticky, language toggle, WhatsApp + Call. Collapses to logo + Menu + WhatsApp on mobile |
| `LeadForm` | all templates | JotForm embed via Worker; accepts `city`, `locality`, `context` props for prefill |
| `WhatsAppButton` | all | Builds `wa.me` link with page-aware prefilled text |
| `LocalityMap` | city hub, locality, project | Leaflet + OSM; markers from `localities.json`; optional GeoJSON overlay |
| `KeyFacts` | locality | Definition-list table with source footnotes |
| `CircleRateTable` | circle rate page, locality | Sortable, filterable, print stylesheet |
| `Calculator` | tools, circle rate page | Shared shell; each tool passes its own compute function |
| `ProjectCard`, `LocalityCard`, `GuideCard`, `UpdateRow` | lists everywhere | One design each, both languages |
| `StatusChip`, `PriceBandChip` | cards, headers | Colour map defined once |
| `BrokerNote` | city hub, locality | Quote style, photo, date |
| `SourceStamp` | every data page | "Source · effective date · page updated" line |
| `FAQ` | locality, guide, tool, circle rate | Renders visible Q&As and FAQPage JSON-LD from the same array |
| `WhatChanged` | homepage | Three newest updates |
| `Breadcrumb` | all except home | Also emits BreadcrumbList JSON-LD |
| `Footer` | all | Full index, legal, RERA disclosure |
| `TrustBar`, `BrokerCard`, `WhyWeExist`, `HowWeWork`, `Reviews`, `Badges` | homepage, city hubs, about, guides | Trust layer, see Template 9 |

Design direction: probate.help's architecture adapted to land (measured tokens in `docs/DESIGN-REFERENCE.md`). Cream `#f6f1e8` page, vellum `#fbf7ef` cards, ink `#1f1a14`, hairline `#d9cdb6`; one deep green accent mixed in oklch at the reference's lightness and chroma. Latin: Fraunces display serif at 350–480 for headings, ledes and card titles, Instrument Serif italic for the accent phrase, Inter for body and UI, JetBrains Mono for eyebrows and labels. Devanagari: Noto Sans Devanagari at 600 for headings. Card radius by role (14 / 16 / 18 / 20 / 24), pills 999, section rhythm 96 / 112 / 140, no `backdrop-filter`, no stock photography.

## SEO and schema

| Requirement | Detail |
| --- | --- |
| Titles | Per language, written not translated. Locality pattern: `<Locality> land rate, plots and circle rate 2026 · <City>`. Hindi: `<Locality> में जमीन का रेट, प्लॉट और सर्किल रेट 2026` |
| Meta descriptions | Per language, 140–155 chars, generated from record fields for data pages, hand-written for guides |
| Canonical | Self-referencing on every page, absolute URL |
| hreflang | `en-IN`, `hi-IN`, `x-default` (→ en) on every paired page |
| JSON-LD | `Organization` + `RealEstateAgent` (site-wide), `BreadcrumbList` (all), `FAQPage` (locality, guide, tool, circle rate), `Article` (guide, update), `Place` with `geo` (locality), `Person` (broker) |
| Sitemaps | `sitemap-index.xml` → `sitemap-en.xml`, `sitemap-hi.xml`, `sitemap-updates.xml`; `lastmod` from `updatedAt` |
| robots.txt | Allow all; sitemap line; no crawl of `/api/` |
| llms.txt | Plain index of the site for AI crawlers, regenerated at build |
| Internal linking | Every locality links to city hub, 6 nearest localities, nearby projects, circle rate page. Every project links to affected localities. Every update links to affected localities and projects. Guides link to at least 3 data pages via MDX components |
| Images | WebP with AVIF fallback, explicit width/height, alt text per language, lazy below the fold |
| Performance | Target Lighthouse 95+ mobile. No third-party scripts except JotForm on form load and Leaflet on map pages. Fonts self-hosted |
| Thin-page guard | Localities missing the minimum field set are excluded from the build and the sitemap |
| Open Graph | Per-page OG image generated at build with locality name, price band and city on the brand background |

## Launch page count and phasing

Launch at roughly 260–310 pages in week 4–5, then grow to 1000+ over the following 8 weeks. Ranking on a new domain takes 6–12 months regardless, so launching early and adding pages beats waiting.

| Page type | Launch (EN) | Launch (HI) | Month 3 target (EN + HI) |
| --- | --- | --- | --- |
| Homepage | 1 | 1 | 2 |
| City hub | 3 | 3 | 6 |
| Locality | 100–120 | 30–40 | 400–500 |
| Project | 25–30 | 10 | 120 |
| Circle rate | 3 | 3 | 6 |
| Tehsil rate | 5 | 5 | 10 |
| Village rate | 1,630 | 1,630 | 3,260 |
| Guide | 20 | 7 | 80 |
| Tool | 4 | 4 | 8 |
| Update entry | 30–40 | 10 | 200+ |
| Standard | 9 | 9 | 18 |
| **Total** | **~200–230** | **~80** | **~850–950** |

The village rate pages sit outside that trajectory on purpose: they all build, but ship `noindex` and out of the sitemaps until opened in batches (Template 5b). The indexable count is what the table above is about.

**Build order for Claude Code**

1. Repo scaffold: Next.js static export, Tailwind, Zod schemas for every JSON file, `/data` with two seed localities, one project, one circle-rate schedule, one update. Validation script wired into `next build`.
2. Shared components and the two hand-authored templates (homepage, city hub) with seed data.
3. Locality template, then project, circle rate and update templates. Build once with seed data, confirm both language trees render.
4. Guide template with MDX components and two sample guides.
5. Tool shell and the stamp duty calculator.
6. SEO layer: metadata, JSON-LD, sitemaps, hreflang, OG image generation, llms.txt.
7. Lead form via JotForm + Worker, WhatsApp button, analytics.
8. Content load: real `localities.json` and `circleRates.json` from parsed PDFs, projects, updates, guides. This is the long pole and runs in parallel with 4–7.
9. Full circle-rate model: `tehsils.json`, `data/rates/` per published schedule, the import and derive scripts, Templates 5a and 5b, the valuation rules and the calculator rebuilt on them.
10. Cloudflare Pages deploy from GitHub, `NODE_VERSION=22`, `.in` → `.com` redirect, custom domain, Search Console for both trees.

**Content refresh cadence after launch**

- Updates archive: weekly.
- Circle rates: on each IGRSUP revision (usually annual per district).
- Project statuses: monthly.
- Broker notes and price observations: monthly.
- New localities: 30–50 per month until the village layer is covered.
