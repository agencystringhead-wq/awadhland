# Ayodhya village page content — rate list effective 2025-06-07

- ayodhya-villages-2025-06-07.json  One record per RateRow (1,630). Keyed by rateRowId = `${sro}-${vcode || 's'+serial}`,
  matching the step 9 data model. Each record: slug, nameEn, nameHi, category, roadSegmentIds, rank, and `en` / `hi` blocks:
  title, metaDescription, h1, lede, ratesText[], commercialText, agriText|null, plotExamples[], plotExamplesNote,
  roadSegmentsText|null, rulesText[], faq[], sourceLine.
  Every sentence is built from the row's own figures and the tehsil statistics. Nothing about a village is stated that the list does not say.
- indexable.json  866 rateRowIds cleared for the sitemap (rate profile shared by ≤3 villages, or a main-road stretch passes through, or an urban mohalla of Ayodhya city). The other 764 share an identical rate set with dozens of villages and stay noindex until they get village-specific content (broker note).
- ayodhya-village-names.csv  Hindi → English name and slug for every row. Fill `override_en` to correct any spelling; regenerate.
- roman.py  The Hindi→English romaniser used for names and slugs.
- PREVIEW.md  Two sample pages (Rikabganj, Chirra Mohammad Pur) in English and Hindi.

Known limits
- 1,630 rows but only 600 distinct rate sets: the district sets rates by band. That is why 764 pages are held back.
- Milkipur rural rates are genuinely high in the source (₹6,500–12,000/sq m); checked against the scan.
- Stamp duty is not stated in the text; the page calculator computes it from stampDutyRules.json (still marked legal-review).
