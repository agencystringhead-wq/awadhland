# Lucknow circle rates, effective 01-08-2025 (7 of 10 SROs)

Source: IGRSUP मूल्यांकन सूची, Lucknow. Transcribed by hand from the scanned PDFs in data/sources/circle-rates/lucknow/.
प्रारूप-2 and प्रारूप-4 were transcribed separately and joined; names, categories and serials/V-codes agree between the two tables.

Included (1,449 villages/mohallas):
Sadar-1 162, Sadar-2 277, Sadar-3 243, Sadar-5 286, Mohanlalganj 238, Sarojini Nagar 122, Sarojini Nagar-2 121.

Still missing: Sadar-4, Bakshi Ka Talab, Malihabad. The files received for these three are khasra lists
(plot numbers grouped by road frontage), not the मूल्यांकन सूची. Their rate lists need to be downloaded from IGRSUP.

Files
- lucknow-all-rates.csv  THE ONE FILE: every row from all 7 SROs, with columns sro and tehsil_sro. Same columns as the per-SRO files.
- lucknow-<sro>-rates.csv  One row per village/mohalla for that SRO.
    nonagri_lt9m (प्रारूप-2) and nonagri_9to12m / 12to18m / ge18m (प्रारूप-4): land ₹ per sq m by road width. Lucknow uses FOUR bands.
    covered_ordinary / covered_premium: construction (covered area) ₹ per sq m, साधारण / प्रीमियम
    shop / office / godown: commercial ₹ per sq m
    agri_state_district (जनपदीय मार्ग), agri_link (सम्पर्क मार्ग), agri_abadi (आबादी से सटी), agri_general (सामान्य): LAKH ₹ per hectare. Empty for urban rows.
    agri_nh, agri_chakmarg: not used in Lucknow (always empty)
    pargana_hi: pargana or ward as printed. vcode where printed.
- lucknow-<sro>-p3.csv  प्रारूप-3 road-segment rates. `extra` holds any additional printed figure (e.g. agri_lakh_per_ha=N).
- lucknow-importer.csv  rates:import shape (residential = <9 m, commercial = shop, agricultural = general in ₹/ha).
- flagged-rows.csv  Odd-looking but clearly printed values, kept as printed.

Join notes
- Sadar-2's प्रारूप-4 has no serial column, so it was joined on V-code. V-code 1060 is printed twice (बाघामऊ and
  बाघामऊ (शालीमार वन वर्ल्ड)); those two were paired by name. Sadar-2 also prints five duplicate serials (139, 207, 253, 260, 265),
  so use sro + vcode as the key there, not serial.
- Sadar-2 V-code 1082 भरवारा has no प्रारूप-4 row (checked on the scan): only the <9 m and covered rates exist for it.
- Names come from प्रारूप-2. प्रारूप-4 often cuts long names off.

Notable source inconsistencies (kept as printed)
- Sarojini Nagar serial 58: office printed 350000 (likely 35000).
- Sadar-3 serial 111 Tilak Nagar: <9 m 20500 but 9–12 m 16500.
- Sadar-2 serial 118 निशातगंज: covered ordinary printed 3000 (likely 30000).
- Sadar-2 serial 72 ऋषि उद्यान (जुग्गौर): <9 m 10000 but 9–12 m 9000.
- Sadar-2 serials 8 and 189: >18 m printed lower than 12–18 m.

Differences from Ayodhya the data model must handle
- Four road-width bands plus covered-area construction rates.
- Agricultural frontage columns differ (district / link / abadi / general).
- Most Lucknow rows are urban mohallas with no agricultural rates.
- Malihabad's list is dated 31-12-2025, so Lucknow will carry two effective dates once it's in.
