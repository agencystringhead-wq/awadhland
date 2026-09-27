# Awadhland SEO spec: titles, descriptions, H1s and schema (Sept 2026)

Audit of the built site on 27 Sep 2026 (commit 6d70d17): 14,878 HTML pages, 4,416 indexable.
Per-page audit: `seo-audit.csv`. Hand-written copy for core pages: `seo-core-pages.csv`.

## 0. Bugs to fix first

1. **City descriptions say "0 localities, 0 government projects"** on /lucknow/, /gorakhpur/ and their /hi/ pages.
   When a city has no published localities, the description must fall back to rate-row counts
   (villages + SROs), using the same fallback lib/rates.ts already uses for the mega menu.
2. **Duplicate village titles** (about 67 EN and 65 HI indexable pages). This happens when the same village name
   appears twice in one tehsil (e.g. Bhiti x3 in Gola). Disambiguate with the pargana, or with the V-code if the pargana is
   also the same: "Bhiti (Haveli) circle rate 2026 ...".
3. **Two village title formats.** Ayodhya uses "X circle rate 2025: ₹10,800/sq m land, Rudauli tehsil, Ayodhya".
   Gorakhpur and Lucknow use "X circle rate 2026 · Gola, Gorakhpur". Use one format and one year for all three cities (section 2).
4. **Circle Rate Lookup says 2025** in its title and H1 while everything else says 2026. Use the same year variable everywhere.
5. **NewsArticle author is a Person named "Awadhland".** Use the broker (`@id` https://awadhland.com/about/#broker)
   or the Organization. Never a Person with a company name.
6. **Titles over 60 characters**: the home page (80), hubs (70 to 78), 1,036 EN and 922 HI village pages, most updates.
   Google cuts them off at about 580 px.
7. **Boilerplate in every description**: "Every figure sourced and dated. Fees in writing." That's about 50 of 155 characters
   on every page, and it means nothing to someone reading search results. Remove it from all meta descriptions (it can stay on the page).

## 1. General rules

- Title: 60 characters max, main keyword first, sentence case. Add " | Awadhland" (HI: " | अवधलैंड") only when
  the full title still fits in 60. Otherwise leave the brand off. Google shows the site name separately anyway.
  Replace the " · " separator with " | " everywhere.
- Description: 140 to 160 characters after variables are filled in. Say what's on the page, include one real figure where
  there is one, and end with the next step. No boilerplate.
- H1: exactly one per page, containing the main keyword. The Hindi or English name of a place goes in a small line
  above or below the H1 (eyebrow or subtitle), not inside it. So "Ayodhya अयोध्या" as the H1 becomes H1 "Land in Ayodhya: ..." with
  "अयोध्या" as an eyebrow.
- Year: one constant (e.g. `SEO_YEAR` in lib/seo.ts, set to the current year at build time) used in every title and H1 that shows a year.
- Hindi titles and descriptions are written in Hindi, not translated word for word. Use the Hindi copy from the CSV as is.

## 2. Templates for generated pages

Variables: {Village}/{गाँव}, {Tehsil}/{तहसील}, {City}/{शहर}, {Locality}/{इलाक़ा}, {rate} = main land rate per sq m in
Indian format, {agri} = farmland lakh ₹/ha, {date} = effective date, {n} = village count.

### Village rate page `/{city}/circle-rates/{tehsil}/{village}/`
- Title EN: `{Village} circle rate {YEAR}: ₹{rate}/sq m, {Tehsil}, {City}`
  - If over 60 characters, drop ", {Tehsil}". If still over 60, drop ": ₹{rate}/sq m". If duplicated, add " ({Pargana})" after {Village}.
- Title HI: `{गाँव} सर्किल रेट {YEAR}: ₹{rate}/वर्ग मी, {तहसील}, {शहर}` with the same fallbacks.
- Description EN: `{Village} ({गाँव}), {Tehsil} tehsil, {City}: land ₹{rate}/sq m, farmland ₹{agri} lakh/ha, effective {date}. See rates by road width and your stamp duty.`
  (Leave out any figure that's missing for that row. Don't print ₹0.)
- Description HI: `{गाँव} ({Village}), {तहसील} तहसील, {शहर}: ज़मीन ₹{rate}/वर्ग मी, कृषि भूमि ₹{agri} लाख/हेक्टेयर, {date} से लागू। सड़क की चौड़ाई के हिसाब से दर और स्टाम्प ड्यूटी देखें।`
- H1 EN: `{Village} circle rate {YEAR}`, with a subtitle line: `{गाँव} · {Tehsil} tehsil, {City}`
- H1 HI: `{गाँव} सर्किल रेट {YEAR}`, with a subtitle line: `{Village} · {तहसील} तहसील, {शहर}`

### Tehsil / SRO page `/{city}/circle-rates/{tehsil}/`
- Title EN: `{Tehsil} circle rate {YEAR}: all {n} villages, {City}`
- Title HI: `{तहसील} सर्किल रेट {YEAR}: सभी {n} गाँव, {शहर}`
- Description EN: `Circle rates for all {n} villages in {Tehsil} tehsil, {City}, effective {date}. Land from ₹{min} to ₹{max} per sq m, plus farmland and shop rates.`
- Description HI: `{तहसील} तहसील, {शहर} के सभी {n} गाँवों के सर्किल रेट, {date} से लागू। ज़मीन ₹{min} से ₹{max} प्रति वर्ग मीटर, साथ में कृषि और दुकान की दरें।`
- H1 EN: `{Tehsil} tehsil circle rates {YEAR}` / H1 HI: `{तहसील} तहसील के सर्किल रेट {YEAR}`

### Locality page `/{city}/{locality}/`
- Title EN: `{Locality}, {City}: plot rates and circle rate {YEAR}`
- Title HI: `{इलाक़ा}, {शहर}: प्लॉट के दाम और सर्किल रेट {YEAR}`
- Description EN: `Buying land in {Locality}, {City}? Circle rate ₹{rate}/sq m (from {date}), land use, distances and nearby projects, with a local broker on WhatsApp.`
- Description HI: `{इलाक़ा}, {शहर} में ज़मीन लेनी है? सर्किल रेट ₹{rate}/वर्ग मी ({date} से), भू-उपयोग, दूरियाँ और आसपास के प्रोजेक्ट, व्हाट्सऐप पर स्थानीय ब्रोकर के साथ।`
- H1 EN: `Land in {Locality}, {City}` (Hindi name as eyebrow) / H1 HI: `{इलाक़ा}, {शहर} में ज़मीन`

### Guides and updates
- H1 stays the full headline. The title tag uses the short title from the CSV when one is given. Otherwise it uses the
  headline, adding " | Awadhland" only if it fits in 60. Add an optional `seoTitle` field to guide frontmatter and update records for this.
- Description: keep the current hand-written ones (they're good). Just make sure none ends mid-word with "…".

## 3. Schema

Keep what's there (Organization, RealEstateAgent, BreadcrumbList, Article, FAQPage, Person, Place on localities). Change or add:

| Page | Add / change |
|---|---|
| Sitewide RealEstateAgent | `image` (portrait), `logo` as a 512x512 PNG (not only the SVG), `priceRange` omitted, `sameAs` with the Google Business Profile URL once live, `address` once the GBP address is final (leave out until then, don't make one up), `knowsLanguage: ["hi","en"]` |
| Home | `WebSite` with `name: "Awadhland"`, `alternateName: ["AwadhLand","अवधलैंड","awadhland.com"]`, `url`, `inLanguage` |
| About | Person: add `knowsAbout` (land buying, circle rates, khatauni, registry in UP), `knowsLanguage`, and `hasCredential` for UP RERA with the registration number from data/team.json if it's there (skip if not), plus `sameAs` with the GBP URL once live. Page type `AboutPage`. |
| City hubs | `CollectionPage` with `about` = City (with `containedInPlace` Uttar Pradesh) and an `ItemList` of the localities or SROs linked from the page |
| Circle-rate hub + tehsil pages | `Dataset`: name, description (at least 50 characters), `creator` = GovernmentOrganization "Department of Stamps and Registration, Uttar Pradesh" with url igrsup.gov.in, `temporalCoverage` = "{effective date}/..", `spatialCoverage` = the City/tehsil Place, `isAccessibleForFree: true`, `license` omitted, `url` |
| Village rate pages | `Place` (name EN + `alternateName` HI, `containedInPlace` tehsil then City), and a light `Dataset` like the tehsil one scoped to the village. No FAQPage on these 4,000+ pages. |
| Tools | `WebApplication`: name, url, `applicationCategory: "FinanceApplication"` (lookup/khasra: "UtilitiesApplication"), `operatingSystem: "Any"`, `offers` price 0 INR, `inLanguage`. Keep the FAQPage. |
| Guides | Article: add `image` (the page's OG image URL) |
| Updates | NewsArticle: add `image` (OG image), fix `author` (bug 5) |
| Updates index | `CollectionPage` + `ItemList` of the entries |
| Project pages | `Article` about the project, with `about` = `Airport` for the airport project (a Place type with name and address "Ayodhya, Uttar Pradesh"), plus `image` |

Don't add AggregateRating or Review schema for the business on our own site. Google doesn't show self-serving review stars, and it can count as spam.

## 4. Checks to add to the build

Fail the build (or at least warn) when an indexable page has:
- a title over 60 characters or a duplicate title;
- a description under 120 or over 160 characters, a duplicate description, or text like "0 localities";
- anything other than exactly one H1;
- JSON-LD that doesn't parse.

Write a report to `out/seo-report.json` like the check-links step does.
