# Gorakhpur circle rates: all 8 SROs (3,833 villages/mohallas)

Source: IGRSUP मूल्यांकन दर-सूची PDFs for Gorakhpur, transcribed by hand from the scans in data/sources/circle-rates/gorakhpur/.

## Which list is in force (important for the site copy)
- Gorakhpur has had no new rate list since 2016. The Collector's order of 04-08-2020 keeps the 03-08-2016 list in force for the whole
  district "with all its provisions" (reason given: COVID, slow property market).
- In 2025 only the general instructions (rules) changed, not the rates:
  order 05-03-2025 for Sadar-1 and Sadar-2; order 26-04-2025 (effective 28-04-2025) for Gola, Bansgaon, Khajni, Sahjanwa, Chauri Chaura, Campierganj.
  Key 2025 rules: +30% for land on roads wider than 12 m (over the 9–12 m rate); farmland within 50 m of plotting/colonies +60%, 50–200 m +40%;
  non-agri land above 1,000 sq m: 15% less on the excess; flats +0/20/30/50% by super area (600/1200/2000 sq ft), amenities +5% each;
  commercial covered construction ₹25,000/sq m; tin shed and boundary-wall rates. (Exact text: the 2025 order PDFs.)
- Sadar-2 and Campierganj: IGRSUP serves the 01-08-2015 list for these two. Campierganj's commercial rates were replaced by an amendment
  effective 19-01-2016 (included, comm_source=amend2016). Worth confirming at those two SRO offices that no separate 2016 list exists.

## Files
- gorakhpur-all-rates.csv   THE ONE FILE. One row per village/mohalla, all tables joined:
    basic_rate           non-agri land ₹/sq m with no road / narrow road (band in basic_band: "upto 2 m", Sadar-1/2 "upto 3 m", Gola/Bansgaon "no road")
    road_first_band, road_5to9m, road_9to12m   non-agri ₹/sq m by road width. First band differs by SRO (road_first_band_label:
                         2–5 m; Sadar-1/2 3–5 m; Gola 1–5 m; Bansgaon up to 5 m). No >12 m column exists: use 9–12 m +30% (2025 rule).
    shop_single_land     land rate for a single shop/commercial unit ₹/sq m
    shop_multi, office   carpet-area rates ₹/sq m for non-single-shop commercial property
    commercial_rent_per_sqm   Sadar-2 only (its 2015 list prices commercial property by monthly rent per sq m; no shop/office table)
    nh_* dist_* link_* other_*   agricultural land, LAKH ₹ per hectare, by frontage (NH/state highway, district road, link road, elsewhere)
                         × plot size a/b/c/d. Slab limits differ (agri_slabs): 0.040/0.100/0.200 ha in most SROs,
                         0.081/0.142/0.202 ha in Sadar-1/2, 0.045/0.101/0.202 ha in Gola. Urban mohallas have no agri rate (dashes in the list).
- gorakhpur-road-segments.csv   प्रारूप-3 road segments (named stretches) with land and/or commercial rates. These override village rates on those roads.
- gorakhpur-trees-flats-other.csv   Tree values, Sadar-1/2 flat rates by mohalla, GIDA plot-type notes.
- gorakhpur-importer.csv   rates:import shape: residential = basic_rate, commercial = shop_single_land, agricultural = other_d (elsewhere, >0.2 ha) in ₹/ha.
- flagged-rows.csv   Everything odd, kept as printed.

## Data notes
- Sahjanwa: the list prints 78 lakh/ha in the link-road >0.2 ha column for many villages. An AIG Registration order dated 09-01-2017,
  printed at the end of the same list, says this is a typing error for 38. Corrected to 38 (flagged on each row).
- Chauri Chaura: one page of the road-width table (serials 103–119) is missing from the PDF, so those 17 villages have no road-band rates.
- Sadar-2 and Sahjanwa have a few villages whose V-code or name is printed differently between tables; those appear as separate partial rows (flagged).
- Likely misprints kept as printed, e.g. Bansgaon serial 303 पिछौरा commercial 220000 (10× the pattern), Khajni dist_a 9200 in several rows
  (probably 920), Khajni serial 579 shop 3000 (probably 30000). All in flagged-rows.csv.
