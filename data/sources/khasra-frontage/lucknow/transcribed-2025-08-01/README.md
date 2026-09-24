# Lucknow khasra road-frontage lists: Sadar-4, Bakshi Ka Talab, Malihabad

What these are: for each revenue village, the khasra (gata) numbers that sit on a highway, a district road, a link road,
or next to the abadi. They are NOT rate lists. No ₹ figures appear anywhere in them.
Both signed notes say the list "मूल्यांकन सूची दर 01.08.2025 का भाग होगा" (it is part of the 01-08-2025 valuation list),
and that in any dispute the Tehsildar's decision is final. Malihabad's download is dated 31-12-2025, but its own note says 01-08-2025.

Coverage: Sadar-4 58 villages (45 pp), Bakshi Ka Talab 219 villages (104 pp), Malihabad 188 villages (70 printed pp).
About 58,000 khasra entries in total. Transcribed by hand from the scans, with page-break joins checked.

Files
- lucknow-khasra-lookup.csv   One row per khasra number: sro, serial, village_hi, category, road_hi, khasra (as printed),
  khasra_base (leading digits, for matching "123" against "123क" or "123/2"), uncertain.
  category: nh = NH / expressway / state highway; district = जनपदीय मार्ग; link = link / other road / खड़ंजा; abadi = next to abadi.
  uncertain: "yes" where a digit was unreadable (token ends in ?), or "split from X" where two numbers were printed with no comma
  (e.g. 467466 also gives 467 and 466). The fused original stays in the file too.
- lucknow-khasra-cells.csv    One row per village × category (× named road in Malihabad) with the full list, source pages and transcriber notes.
- lucknow-khasra-villages.csv One row per village: counts per category, named roads (Malihabad), and notes. Notes carry printed text such as
  "almost all plots have abadi around them / inside nagar nigam limits" (treat every plot as abadi-adjacent), "चकबन्दी", or LDA acquisition.
- flagged-khasra.csv          Every transcriber note, for checking (missing commas, odd numbers kept as printed, duplicate scans dropped).

Handling notes
- BKT's PDF pages are out of order (serials 97–133 sit on pages 66–80). Stitched back into printed order. Page 89 is a rescan of page 87 and was dropped.
- Malihabad page 107 is a rescan of page 105 and was dropped. Even pages in Malihabad are blank.
- Malihabad roads named as a national/state highway or राजमार्ग were moved from link to nh.
- Sadar-4 serials 19, 23, 50 and 57 have "—" in every column. BKT 199 and 211 say only "चकबन्दी".

How the site can use this (no rates needed)
1. Village list for the three "coming soon" SROs.
2. A "check your plot" lookup: village + khasra number → which frontage category it falls in. Under the valuation rules,
   road-frontage or abadi-adjacent agricultural plots are valued higher than general ones, so this tells a buyer whether that uplift applies.
Always show "Verify with the Tehsil / Sub-Registrar office. Tehsildar's decision is final." next to any lookup result.
