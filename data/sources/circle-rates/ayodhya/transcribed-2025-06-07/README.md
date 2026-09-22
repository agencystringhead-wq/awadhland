# Ayodhya district circle rates — effective 07-06-2025

Source: IGRSUP मूल्यांकन सूची, Collector Ayodhya order dated 06-06-2025, effective 07-06-2025.
Scanned PDFs are in data/sources/circle-rates/ayodhya/. Transcribed by hand from the scans (OCR was not reliable on these tables).

All five SROs included: Sadar, Sohawal, Bikapur, Milkipur, Rudauli.

Files
- ayodhya-<sro>-p4.csv  प्रारूप-4 master table, one row per village. All 16 columns.
    nonagri_lt9m / 9to18m / ge18m : non-agricultural land ₹ per sq m by road width (<9 m, 9–18 m, ≥18 m)
    shop / office / godown        : commercial ₹ per sq m (carpet area)
    agri_*                        : agricultural land in LAKH ₹ per hectare, by frontage
                                    (national highway, state/district road, link road, chakmarg, adjoining abadi, general)
- ayodhya-<sro>-p3.csv  प्रारूप-3 road-segment rates (higher rates for plots on named main-road stretches)
- ayodhya-importer.csv  All five SROs in the rates:import shape:
    residential  = nonagri_lt9m (₹/sq m)
    commercial   = shop (₹/sq m)
    agricultural = agri_general converted to ₹/hectare
- flagged-rows.csv      Rows where the printed figure looks odd but is clearly printed. Keep as printed; a few may be typos in the source.

Notes
- Bikapur, Milkipur and Rudauli print no serial column; `serial` there is a running row number, not official. V-code is the key.
- Rudauli uses extra categories: विकासशील, नगरपंचायत. Bikapur uses ग्रामीण(वि0) for developing villages.
- Valuation rules from the instruction pages (for the calculator): +100% agri under 0.1 ha in urban/semi-urban/developing villages;
  +60% 0.1–0.2 ha; +30% within 200 m of residential/commercial activity; non-agri plots over 1,000 sq m valued at 75% for the excess;
  road-segment (प्रारूप-3) rates apply to non-agricultural land only.

Sadar specifics
- Sadar prints the <9 m base rate in a separate table (प्रारूप-2) and the rest in प्रारूप-4; they share serial numbers and were joined on serial. The two were transcribed independently and agree on all 554 names, wards and categories.
- Sadar has no V-codes in these tables; `serial` is the official serial and `ward_hi` the ward/pargana. Two Sadar serials share a name (389, 390 मुगलपुरा, different wards).
- Sadar agricultural columns: agri_nh = national/state highway (printed as one column), agri_state = district road (जनपदीय मार्ग).
- Urban (नगरीय) Sadar rows have no agricultural rates; those cells are empty.
- Sadar road segments (प्रारूप-3): 75 segments, 222 rows, e.g. Chowk / Reedganj / Rikabganj up to ₹40,000 land and ₹86,800 shop per sq m. Note on p82: any mohalla on a listed road but missing from the table takes that segment's rate.
