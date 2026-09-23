/**
 * Zod schemas for every file in /data and for guide frontmatter.
 * Shapes follow docs/BUILD-SPEC.md "Data model". Change the spec first, then this file.
 *
 * Relative imports only: this file is loaded by scripts/validate.ts via tsx as well as by Next.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ primitives */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isoDate = z
  .string()
  .regex(ISO_DATE, "expected YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), {
    message: "not a real calendar date",
  });

/** Stable, lowercase, hyphenated id. Used in URLs, so no uppercase, no Devanagari. */
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected lowercase-hyphenated slug");

export const url = z.url({ protocol: /^https$/, message: "expected an https URL" });

export const source = z
  .object({
    label: z.string().min(1),
    url,
    accessedAt: isoDate,
  })
  .strict();

/** Every record carries at least one source. A record without sources does not ship (CLAUDE.md). */
export const sources = z.array(source).min(1, "every record needs at least one source");

/** Open items on seed or placeholder data. Validation passes; scripts/validate.ts prints them as warnings. */
export const todo = z.array(z.string().min(1)).optional();

const recordBase = {
  sources,
  updatedAt: isoDate,
  todo,
};

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

/* ---------------------------------------------------------------------- enums */

export const priceBand = z.enum(["low", "mid", "high", "premium"]);
export const fitRating = z.enum(["good", "mixed", "poor"]);
export const landUse = z.enum(["residential", "commercial", "mixed", "agricultural", "industrial", "institutional", "green-belt", "other"]);
export const agency = z.enum(["ADA", "LDA", "GDA", "UPEIDA", "NHAI", "UPSIDA", "other"]);
export const projectStatus = z.enum(["announced", "approved", "under-construction", "partially-open", "complete", "stalled"]);
export const impactLevel = z.enum(["strong", "moderate", "mild"]);
export const updateType = z.enum(["circle-rate", "master-plan", "project", "rera", "policy", "court"]);
export const buyerCategory = z.enum(["male", "female", "joint"]);
export const observationSource = z.enum(["broker", "listing", "registry"]);

/* --------------------------------------------------------------------- cities */

export const anchorSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    nameHi: z.string().min(1),
    lat,
    lng,
  })
  .strict();

export const citySchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    nameHi: z.string().min(1),
    district: z.string().min(1),
    state: z.literal("UP"),
    lat,
    lng,
    intro: z.string().min(1),
    introHi: z.string().min(1),
    brokerNote: z.string().optional(),
    brokerNoteHi: z.string().optional(),
    brokerNoteDate: isoDate.optional(),
    anchors: z.array(anchorSchema).min(1),
    ...recordBase,
  })
  .strict();

export const citiesFileSchema = z.array(citySchema);

/* ----------------------------------------------------------------- localities */

export const circleRateOnLocalitySchema = z
  .object({
    /** ₹ per sq m, as published */
    residential: z.number().positive(),
    /** ₹ per sq m, as published */
    commercial: z.number().positive(),
    /** ₹ per hectare, as published */
    agricultural: z.number().positive(),
    unit: z.literal("sqm|hectare"),
    effectiveFrom: isoDate,
    sourceUrl: url,
  })
  .strict();

/** Rating plus the one line why (spec Template 3, section 6). */
export const fitEntrySchema = z
  .object({
    rating: fitRating,
    reason: z.string().min(1),
    reasonHi: z.string().min(1).optional(),
  })
  .strict();

export const localitySchema = z
  .object({
    id: slug,
    cityId: slug,
    parentLocalityId: slug.nullable(),
    /**
     * draft: seeded with placeholders; renders on every build but is noindex and absent from the
     * sitemaps. live: real, sourced data; indexable. Upgrading is a data change.
     */
    status: z.enum(["draft", "live"]),
    name: z.string().min(1),
    nameHi: z.string().min(1).optional(),
    tehsil: z.string().min(1).optional(),
    pincode: z
      .string()
      .regex(/^\d{6}$/, "expected 6-digit pincode")
      .optional(),
    // lat/lng, circleRate, landUse and narrative are optional in the schema so that
    // incomplete records validate and are skipped by the thin-page guard (lib/guards.ts)
    // instead of failing the build.
    lat: lat.optional(),
    lng: lng.optional(),
    priceBand: priceBand.optional(),
    /**
     * UP RERA coverage: how many RERA-registered projects sit in this locality, and when that was
     * counted. Looked up on the UP RERA project search, which lists registrations by district and
     * project address; it is not derivable from anything already in this repo.
     *
     * A rural locality with no formal projects legitimately counts 0 and scores nothing on this
     * signal. That is the signal working, not failing: it measures formal development activity,
     * which is what the spec weights at 10 points.
     */
    reraProjects: z
      .object({
        count: z.number().int().min(0),
        asOf: isoDate,
      })
      .strict()
      .optional(),
    askingRange: z
      .object({
        low: z.number().positive(),
        high: z.number().positive(),
        unit: z.literal("sqft"),
        asOf: isoDate,
      })
      .strict()
      .refine((r) => r.low <= r.high, { message: "askingRange.low must be <= high" })
      .optional(),
    /**
     * Superseded by rateRefs. Kept optional so cities without a transcribed list (Lucknow,
     * Gorakhpur) keep rendering while their lists are still seed data.
     */
    circleRate: circleRateOnLocalitySchema.optional(),
    /**
     * Rows of the published rate list that cover this locality. A locality may span several
     * villages or mohallas, so pages show the range across all of them. Written by
     * `npm run rates:import-list`; see scripts/rate-aliases.json for the manual overrides.
     */
    rateRefs: z.array(z.object({ rateRowId: z.string().min(1) }).strict()).optional(),
    roadSegmentRefs: z.array(z.object({ id: z.string().min(1) }).strict()).optional(),
    landUse: landUse.optional(),
    landUseSource: z.string().min(1).optional(),
    /** minutes, keyed by city anchor id */
    driveTimes: z.record(slug, z.number().int().positive()).optional(),
    narrative: z
      .object({
        drivers: z.array(z.string().min(1)),
        driversHi: z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    /**
     * Who the locality suits. Each of the three is optional and the block renders only what is
     * present, because the three rest on different evidence: a commercial read can be grounded in
     * the published shop rate and the priced corridors, while residential and investment need
     * demand, amenities and a price series that no schedule carries. Half a section backed by the
     * list beats three columns where two are guesses.
     */
    fit: z
      .object({
        residential: fitEntrySchema.optional(),
        commercial: fitEntrySchema.optional(),
        investment: fitEntrySchema.optional(),
      })
      .strict()
      .refine((f) => Boolean(f.residential || f.commercial || f.investment), {
        message: "fit needs at least one of residential, commercial or investment",
      })
      .optional(),
    pros: z.array(z.string().min(1)).optional(),
    prosHi: z.array(z.string().min(1)).optional(),
    cons: z.array(z.string().min(1)).optional(),
    consHi: z.array(z.string().min(1)).optional(),
    risks: z.array(z.string().min(1)).optional(),
    risksHi: z.array(z.string().min(1)).optional(),
    brokerNote: z.string().optional(),
    brokerNoteHi: z.string().optional(),
    brokerNoteDate: isoDate.optional(),
    ...recordBase,
  })
  .strict();

export const localitiesFileSchema = z.array(localitySchema);

/* ------------------------------------------------------------------- projects */

const position = z.tuple([lng, lat]);
const linearRing = z.array(position).min(4);

export const geometrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Point"), coordinates: position }).strict(),
  z.object({ type: z.literal("LineString"), coordinates: z.array(position).min(2) }).strict(),
  z.object({ type: z.literal("Polygon"), coordinates: z.array(linearRing).min(1) }).strict(),
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.array(linearRing).min(1)).min(1) }).strict(),
]);

export const projectSchema = z
  .object({
    id: slug,
    cityId: slug,
    name: z.string().min(1),
    nameHi: z.string().min(1),
    agency,
    /** Required when agency is "other", e.g. "Airports Authority of India" */
    agencyName: z.string().min(1).optional(),
    status: projectStatus,
    budgetCr: z.number().positive().nullable(),
    announcedOn: isoDate.nullable(),
    expectedCompletion: z.string().min(1).nullable(),
    extent: z
      .object({
        value: z.number().positive(),
        unit: z.enum(["hectare", "km"]),
      })
      .strict()
      .nullable(),
    /** paragraphs */
    description: z.array(z.string().min(1)).min(1),
    descriptionHi: z.array(z.string().min(1)).min(1),
    geometry: geometrySchema.nullable(),
    affectedLocalityIds: z.array(slug),
    impacts: z.array(
      z
        .object({
          localityId: slug,
          level: impactLevel,
          reason: z.string().min(1),
          reasonHi: z.string().min(1).optional(),
        })
        .strict(),
    ),
    milestones: z.array(
      z
        .object({
          date: isoDate,
          text: z.string().min(1),
          textHi: z.string().min(1).optional(),
          sourceUrl: url,
        })
        .strict(),
    ),
    ...recordBase,
  })
  .strict()
  .refine((p) => p.agency !== "other" || !!p.agencyName, {
    message: 'agencyName is required when agency is "other"',
    path: ["agencyName"],
  });

export const projectsFileSchema = z.array(projectSchema);

/* ---------------------------------------------------------------- circleRates */

export const circleRateRowSchema = z
  .object({
    localityId: slug,
    tehsil: z.string().min(1),
    residential: z.number().positive(),
    commercial: z.number().positive(),
    agricultural: z.number().positive(),
    effectiveFrom: isoDate,
    sourceUrl: url,
  })
  .strict();

export const circleRateScheduleSchema = z
  .object({
    id: slug,
    cityId: slug,
    effectiveFrom: isoDate,
    sourceUrl: url,
    archiveUrl: url.nullable(),
    /** Units as published: residential and commercial ₹/sq m, agricultural ₹/hectare. Never store converted values. */
    units: z
      .object({
        residential: z.literal("sqm"),
        commercial: z.literal("sqm"),
        agricultural: z.literal("hectare"),
      })
      .strict(),
    rates: z.array(circleRateRowSchema).min(1),
    ...recordBase,
  })
  .strict();

export const circleRatesFileSchema = z.array(circleRateScheduleSchema);

/* -------------------------------------------------------------------- tehsils */

/**
 * A tehsil and the sub-registrar office that publishes its rate list. The SRO is the unit the
 * IGRSUP schedules are organised by, so it is what the rate pages are grouped and sourced under.
 */
export const tehsilSchema = z
  .object({
    id: slug,
    cityId: slug,
    name: z.string().min(1),
    nameHi: z.string().min(1),
    /** Sub-registrar office, as named on the published list */
    sroName: z.string().min(1),
    sroNameHi: z.string().min(1),
    /**
     * Optional, and nothing renders them today. Ayodhya's five were seeded with approximate
     * headquarters coordinates and carry a TODO saying so. Lucknow's ten are omitted rather than
     * guessed: an approximate coordinate that no page draws is a fact waiting to be quoted as if
     * it were surveyed.
     */
    lat: lat.optional(),
    lng: lng.optional(),
    /**
     * Whether this SRO's rate list has been transcribed.
     *
     * A district's SROs do not all arrive at once. Lucknow has ten; seven are in and Sadar-4,
     * Bakshi Ka Talab and Malihabad are not -- what was received for those three is khasra lists,
     * plot numbers grouped by frontage, not the मूल्यांकन सूची. They are registered so the city hub
     * can name them and say the rates are coming, which is truer than leaving them off the page
     * and letting a reader conclude the district ends at seven. "pending" generates no village
     * pages and nothing enters a sitemap.
     */
    ratesStatus: z.enum(["published", "pending"]).default("published"),
    ...recordBase,
  })
  .strict();

export const tehsilsFileSchema = z.array(tehsilSchema);

/* ---------------------------------------------------------------------- rates */

/**
 * Full published rate list, one file per schedule in data/rates/<city>-<effectiveFrom>.json, so a
 * revision is a new file and never overwrites the previous one (spec Template 5 rules).
 *
 * Units are exactly as published and are never converted in storage:
 *   nonAgri.*, commercial.*  ₹ per square metre
 *   agriLakhPerHa.*          LAKH ₹ per hectare
 * Display conversions live in lib/units.ts.
 */

/** Categories as printed, normalised to one spelling each (अर्द्धनगरीय / अर्धनगरीय → semi-urban). */
export const rateCategory = z.enum(["urban", "semi-urban", "rural", "developing", "notified", "nagar-panchayat"]);

/**
 * ₹ per sq m, non-agricultural land, keyed by road band.
 *
 * The bands are not the same everywhere: Ayodhya's list prints three (under 9 m, 9–18, 18+) and
 * Lucknow's prints four (under 9 m, 9–12, 12–18, 18+). So the keys are data, declared once per
 * schedule in `roadBands`, and a row carries only the bands its own printed line fills -- Sadar-2
 * भरवारा has no प्रारूप-4 row at all and carries just the first.
 *
 * Read it through lib/rates: `baseRate(row)` for the cheapest band, `rateForBand(row, key)` for
 * one column. Every key here must appear in the schedule's roadBands; validate enforces that.
 */
const nonAgriSchema = z.record(z.string().min(1), z.number().positive());

/**
 * ₹ per sq m of covered (construction) area, साधारण / प्रीमियम.
 *
 * Lucknow prints these beside the land rates; Ayodhya's list does not have the column, so its
 * rows carry null rather than a zero that would read as free.
 */
const coveredSchema = z
  .object({
    ordinary: z.number().positive(),
    premium: z.number().positive(),
  })
  .strict();

/** One road-width column of a city's non-agricultural table, in printed order, cheapest first. */
const roadBandSchema = z
  .object({
    /** key used in a row's `nonAgri` map */
    key: z.string().min(1),
    labelEn: z.string().min(1),
    labelHi: z.string().min(1),
    /** metres; null where the band is open-ended (`minM: null` on the first, `maxM: null` on the last) */
    minM: z.number().nonnegative().nullable(),
    maxM: z.number().positive().nullable(),
  })
  .strict();

/** ₹ per sq m of carpet area. */
const commercialSchema = z
  .object({
    shop: z.number().positive(),
    office: z.number().positive(),
    godown: z.number().positive(),
  })
  .strict();

/** Lakh ₹ per hectare by frontage. Null where the printed row leaves the cell empty (urban rows). */
const agriSchema = z
  .object({
    nh: z.number().positive().nullable(),
    state: z.number().positive().nullable(),
    link: z.number().positive().nullable(),
    chakmarg: z.number().positive().nullable(),
    abadi: z.number().positive().nullable(),
    general: z.number().positive().nullable(),
  })
  .strict();

export const rateRowSchema = z
  .object({
    /** `${sro}-${vcode || 's'+serial}`, stable across re-imports */
    id: z.string().min(1),
    sro: slug,
    /** printed page of the source PDF, shown in the source line */
    page: z.string().min(1),
    serial: z.number().int().positive(),
    /** village code; null for Sadar, which prints none */
    vcode: z.string().min(1).nullable(),
    nameHi: z.string().min(1),
    nameEn: z.string().min(1),
    slug,
    wardHi: z.string().min(1).nullable(),
    /**
     * Null where the list prints no category column. Ayodhya prints one on every row; Lucknow
     * prints it for the four Sadar SROs and not for Mohanlalganj or either Sarojini Nagar, so 481
     * rows have none. It is left null rather than inferred -- a ward number is not a category.
     */
    category: rateCategory.nullable(),
    nonAgri: nonAgriSchema,
    /** null where the row prints no commercial line at all (Lucknow Sadar-2 भरवारा) */
    commercial: commercialSchema.nullable(),
    /** null on lists that do not price covered area (Ayodhya) */
    covered: coveredSchema.nullable(),
    agriLakhPerHa: agriSchema,
    /** transcriber's flag on an oddly printed row. Internal only; never rendered. */
    note: z.string().min(1).nullable(),
  })
  .strict();

export const roadSegmentRowSchema = z
  .object({
    id: z.string().min(1),
    sro: slug,
    page: z.string().min(1),
    segmentHi: z.string().min(1),
    segmentEn: z.string().min(1),
    villageHi: z.string().min(1),
    /** the RateRow this segment's village resolves to, or null when it matched nothing */
    rateRowId: z.string().min(1).nullable(),
    /** ₹ per sq m; segment rates apply to non-agricultural land only (instruction 24) */
    nonAgri: z.number().positive(),
    shop: z.number().positive(),
    office: z.number().positive(),
    godown: z.number().positive(),
    note: z.string().min(1).nullable(),
  })
  .strict();

export const rateScheduleSchema = z
  .object({
    cityId: slug,
    effectiveFrom: isoDate,
    /** date of the Collector's order that published the list */
    orderDate: isoDate,
    sourceDocs: z
      .array(
        z
          .object({
            sro: slug,
            /** repo-relative path to the scanned source, for provenance. The file itself is gitignored. */
            pdfPath: z.string().min(1),
            /** archived copy on R2 */
            archiveUrl: url.nullable(),
            igrsupUrl: url,
            /**
             * When this SRO's list took effect, where that differs from the schedule's date.
             * A district does not revise every SRO on one day: Lucknow's seven published SROs are
             * all 01-08-2025 but Malihabad's list is dated 31-12-2025, so the date shown on a page
             * has to come from the SRO that priced the row, not from the city.
             */
            effectiveFrom: isoDate.optional(),
            orderDate: isoDate.optional(),
          })
          .strict(),
      )
      .min(1),
    /** The non-agricultural road-width columns this city's list prints, cheapest first. */
    roadBands: z.array(roadBandSchema).min(1),
    rows: z.array(rateRowSchema).min(1),
    roadSegments: z.array(roadSegmentRowSchema),
    ...recordBase,
  })
  .strict();

/** data/rates/indexable.json — rate rows opened to search, widened in batches. */
export const indexableRatesFileSchema = z
  .object({
    /** RateRow ids that may be indexed even without a locality referencing them */
    rateRowIds: z.array(z.string().min(1)),
    note: z.string().min(1),
  })
  .strict();

/* ---------------------------------------------------------------------- units */

/** Local area units used for display only. Stored figures are always in the published unit. */
export const unitsFileSchema = z
  .object({
    sqmPerHectare: z.literal(10000),
    bigha: z
      .object({
        /** square metres in one local pakka bigha */
        sqm: z.number().positive(),
        label: z.string().min(1),
        labelHi: z.string().min(1),
        ...recordBase,
      })
      .strict(),
  })
  .strict();

/* ------------------------------------------------------------- valuationRules */

/** Which part of the calculation a rule adjusts. */
export const valuationRuleApplies = z.enum(["non-agricultural", "agricultural"]);

export const valuationRuleSchema = z
  .object({
    id: slug,
    /** instruction number as printed on the list's general-instructions pages */
    instruction: z.string().min(1),
    applies: valuationRuleApplies,
    /** percentage added to the base circle value; negative for a discount */
    pct: z.number(),
    label: z.string().min(1),
    labelHi: z.string().min(1),
    description: z.string().min(1),
    descriptionHi: z.string().min(1),
    ...recordBase,
  })
  .strict();

export const valuationRulesFileSchema = z
  .object({
    effectiveFrom: isoDate,
    /** the part of a non-agricultural plot above this area is valued at `largePlotPct` */
    largePlotThresholdSqm: z.number().positive(),
    largePlotPct: z.number().positive(),
    rules: z.array(valuationRuleSchema).min(1),
    ...recordBase,
  })
  .strict();

/* ------------------------------------------------------------- stampDutyRules */

export const stampDutyRuleSchema = z
  .object({
    id: slug,
    state: z.literal("UP"),
    buyerCategory,
    stampDutyPct: z.number().min(0).max(100),
    registrationFeePct: z.number().min(0).max(100),
    /** ₹, null when uncapped */
    registrationFeeCap: z.number().positive().nullable(),
    rebate: z
      .object({
        description: z.string().min(1),
        pct: z.number().min(0).max(100).nullable(),
        maxPropertyValue: z.number().positive().nullable(),
      })
      .strict()
      .nullable(),
    effectiveFrom: isoDate,
    sourceUrl: url,
    ...recordBase,
  })
  .strict();

export const stampDutyRulesFileSchema = z.array(stampDutyRuleSchema);

/* -------------------------------------------------------------------- updates */

export const updateSchema = z
  .object({
    id: z.string().regex(/^\d{4}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected <yyyy-mm>-<slug>"),
    date: isoDate,
    title: z.string().min(1),
    titleHi: z.string().min(1),
    agency,
    agencyName: z.string().min(1).optional(),
    type: updateType,
    cityIds: z.array(slug).min(1),
    localityIds: z.array(slug),
    projectIds: z.array(slug),
    /** paragraphs */
    summary: z.array(z.string().min(1)).min(1),
    summaryHi: z.array(z.string().min(1)).min(1),
    sourceUrl: url,
    archiveUrl: url.nullable(),
    ...recordBase,
  })
  .strict()
  .refine((u) => u.id.startsWith(u.date.slice(0, 7)), {
    message: "id must start with the yyyy-mm of date",
    path: ["id"],
  })
  .refine((u) => u.agency !== "other" || !!u.agencyName, {
    message: 'agencyName is required when agency is "other"',
    path: ["agencyName"],
  });

export const updatesFileSchema = z.array(updateSchema);

/* ---------------------------------------------------------- priceObservations */

export const priceObservationSchema = z
  .object({
    id: slug,
    localityId: slug,
    date: isoDate,
    low: z.number().positive(),
    high: z.number().positive(),
    unit: z.literal("sqft"),
    source: observationSource,
    ...recordBase,
  })
  .strict()
  .refine((o) => o.low <= o.high, { message: "low must be <= high" });

export const priceObservationsFileSchema = z.array(priceObservationSchema);

/* ----------------------------------------------------------------------- team */

export const teamMemberSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    nameHi: z.string().min(1),
    role: z.string().min(1),
    reraNumber: z.string().min(1).nullable(),
    reraUrl: url.nullable(),
    yearsActive: z.number().int().min(0),
    phone: z.string().regex(/^\+91\d{10}$/, "expected +91 followed by 10 digits"),
    whatsapp: z.string().regex(/^91\d{10}$/, "expected wa.me format: 91 followed by 10 digits"),
    photo: z.string().min(1),
    bio: z.string().min(1),
    bioHi: z.string().min(1),
    ...recordBase,
  })
  .strict();

export const teamFileSchema = z.array(teamMemberSchema).min(1, "team.json needs at least the broker");

/* -------------------------------------------------------------------- scoring */

export const scoringSignalKey = z.enum([
  "connectivity",
  "masterPlanLandUse",
  "priceMomentum",
  "governmentProjectProximity",
  "reraCoverage",
  "litigationRisk",
]);

export const scoringSchema = z
  .object({
    version: z.number().int().positive(),
    maxScore: z.literal(100),
    signals: z
      .array(
        z
          .object({
            key: scoringSignalKey,
            label: z.string().min(1),
            labelHi: z.string().min(1),
            weight: z.number().int().positive(),
            direction: z.enum(["positive", "negative"]),
          })
          .strict(),
      )
      .length(6),
    ...recordBase,
  })
  .strict()
  .refine((s) => new Set(s.signals.map((x) => x.key)).size === 6, {
    message: "each of the six signals must appear exactly once",
    path: ["signals"],
  })
  .refine((s) => s.signals.reduce((sum, x) => sum + x.weight, 0) === s.maxScore, {
    message: "signal weights must sum to maxScore (100)",
    path: ["signals"],
  });

/* ------------------------------------------------------------ guide frontmatter */

export const locale = z.enum(["en", "hi"]);

export const guideFrontmatterSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    slug,
    lang: locale,
    /** team.json id, or "wwiser" for the editorial byline */
    author: slug,
    publishedAt: isoDate,
    updatedAt: isoDate,
    cityIds: z.array(slug),
    tags: z.array(slug),
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) }).strict()),
    heroImage: z.string().min(1),
    /** slug of the matching guide in the other language, or null */
    pairedSlug: slug.nullable(),
    todo,
  })
  .strict();

/* ---------------------------------------------------------------------- types */

/* -------------------------------------------------------------------- reviews */

/** One Google review, shown exactly as written; never edited (spec Template 9). */
export const reviewSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    date: isoDate,
    /** "bought a plot", "NRI purchase", "commercial land" */
    purpose: z.string().min(1),
    purposeHi: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    text: z.string().min(1),
    /** Hindi reviews are shown in Hindi; English reviews are translated by a person, or left as written */
    textHi: z.string().min(1),
  })
  .strict();

/**
 * Google Business Profile summary plus the reviews shown on the site. Single object.
 *
 * Everything here is nullable or may be empty, because the site ships before the profile has
 * anything in it and the alternative — a placeholder rating, a placeholder count and reviews
 * under invented names — is not one. Spec Template 9: "Everything on this page is verifiable or
 * it comes off", and reviews are shown as written on Google, never composed here.
 *
 * With `rating` null and `reviews` empty, the homepage and About blocks omit themselves and the
 * profile link disappears from the nav. AggregateRating JSON-LD stays off until these are real
 * and kept in sync (lib/jsonld.ts).
 */
export const reviewsSchema = z
  .object({
    platform: z.literal("google"),
    /** null until the business has a profile worth linking */
    profileUrl: url.nullable(),
    /** null until the profile carries real reviews; never a placeholder figure */
    rating: z.number().min(0).max(5).nullable(),
    count: z.number().int().min(0),
    /** up to four sub-scores shown as tiles on the homepage; empty until they are real */
    categories: z
      .array(z.object({ label: z.string().min(1), labelHi: z.string().min(1), score: z.number().min(0).max(5) }).strict())
      .max(4),
    reviews: z.array(reviewSchema),
    ...recordBase,
  })
  .strict();

export type Source = z.infer<typeof source>;
export type Reviews = z.infer<typeof reviewsSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type City = z.infer<typeof citySchema>;
export type Anchor = z.infer<typeof anchorSchema>;
export type Locality = z.infer<typeof localitySchema>;
export type Project = z.infer<typeof projectSchema>;
export type CircleRateSchedule = z.infer<typeof circleRateScheduleSchema>;
export type CircleRateRow = z.infer<typeof circleRateRowSchema>;
export type Tehsil = z.infer<typeof tehsilSchema>;
export type RateSchedule = z.infer<typeof rateScheduleSchema>;
export type RateRow = z.infer<typeof rateRowSchema>;
export type RoadSegmentRow = z.infer<typeof roadSegmentRowSchema>;
export type RoadBand = z.infer<typeof roadBandSchema>;
export type RateCategory = z.infer<typeof rateCategory>;
export type Units = z.infer<typeof unitsFileSchema>;
export type ValuationRules = z.infer<typeof valuationRulesFileSchema>;
export type ValuationRule = z.infer<typeof valuationRuleSchema>;
export type StampDutyRule = z.infer<typeof stampDutyRuleSchema>;
export type Update = z.infer<typeof updateSchema>;
export type PriceObservation = z.infer<typeof priceObservationSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type Scoring = z.infer<typeof scoringSchema>;
export type GuideFrontmatter = z.infer<typeof guideFrontmatterSchema>;
export type Locale = z.infer<typeof locale>;
export type PriceBand = z.infer<typeof priceBand>;
export type ProjectStatus = z.infer<typeof projectStatus>;
export type FitRating = z.infer<typeof fitRating>;
export type FitEntry = z.infer<typeof fitEntrySchema>;

/* ------------------------------------------------------------ file registry */

/** One entry per /data file. scripts/validate.ts iterates this; lib/data.ts parses the same files. */
/* --------------------------------------------------------------- standard pages */

/**
 * Hand-written standard pages (spec "Standard pages") whose copy is data rather than a template:
 * one record per page, both languages side by side so neither is a translation of the other.
 *
 * They live here rather than in lib/content.ts so that `npm run validate` surfaces their `todo`
 * the same way it does for guides and seed records — legal copy that no lawyer has read yet must
 * be visible in the build output, not buried in a source file.
 */
export const standardPageSchema = z
  .object({
    id: z.string().min(1),
    sitePath: z.string().regex(/^\/[a-z0-9-]+\/$/, "sitePath is a root-level path like /privacy/"),
    title: z.string().min(1),
    titleHi: z.string().min(1),
    description: z.string().min(1),
    descriptionHi: z.string().min(1),
    lede: z.string().min(1),
    ledeHi: z.string().min(1),
    sections: z
      .array(
        z
          .object({
            heading: z.string().min(1),
            headingHi: z.string().min(1),
            body: z.array(z.string().min(1)).min(1),
            bodyHi: z.array(z.string().min(1)).min(1),
          })
          .strict(),
      )
      .min(1),
    updatedAt: isoDate,
    sources,
    todo: z.array(z.string().min(1)).optional(),
  })
  .strict();

export type StandardPage = z.infer<typeof standardPageSchema>;
export const standardPagesFileSchema = z.array(standardPageSchema).min(1);

/* ------------------------------------------------------------- village notes */

/**
 * Broker notes on individual village rate pages, keyed by rateRowId.
 *
 * The rate list says what the government values land at; it cannot say what is actually happening
 * on a particular village's roads. A note is the one thing on these pages not derived from the
 * schedule, so it is also what earns a page its place in the sitemap: a village with a note is
 * indexable even when its rate profile is shared with dozens of others (step 9b, point 4).
 */
export const villageNoteSchema = z
  .object({
    brokerNote: z.string().min(1).optional(),
    brokerNoteHi: z.string().min(1).optional(),
    brokerNoteDate: isoDate.optional(),
  })
  .strict()
  .refine((n) => !(n.brokerNote || n.brokerNoteHi) || Boolean(n.brokerNoteDate), {
    message: "a broker note needs brokerNoteDate",
  });

export type VillageNote = z.infer<typeof villageNoteSchema>;
export const villageNotesFileSchema = z.record(z.string().min(1), villageNoteSchema);

/**
 * Generated by scripts/build-village-index.ts from the written village content: the slug and
 * English name per rate row, and nothing else. It exists so lib/rates.ts can apply the content's
 * romanisation without importing the 20 MB content file, which is reachable from a client bundle.
 * Do not hand-edit; change the content and re-run `npm run rates:village-index`.
 */
export const villageSlugsFileSchema = z.record(
  z.string().min(1),
  z.object({ slug: slug, nameEn: z.string().min(1) }).strict(),
);

export const dataFiles = {
  "cities.json": citiesFileSchema,
  "localities.json": localitiesFileSchema,
  "projects.json": projectsFileSchema,
  "circleRates.json": circleRatesFileSchema,
  "tehsils.json": tehsilsFileSchema,
  "units.json": unitsFileSchema,
  "valuationRules.json": valuationRulesFileSchema,
  "stampDutyRules.json": stampDutyRulesFileSchema,
  "updates.json": updatesFileSchema,
  "priceObservations.json": priceObservationsFileSchema,
  "team.json": teamFileSchema,
  "scoring.json": scoringSchema,
  "reviews.json": reviewsSchema,
  "standardPages.json": standardPagesFileSchema,
  "villageNotes.json": villageNotesFileSchema,
  "villageSlugs.json": villageSlugsFileSchema,
} as const;

export type DataFileName = keyof typeof dataFiles;

/**
 * Top-level URL segments owned by the app. A city id may not use one of these, and a locality id
 * may not be "circle-rates" (it would shadow /<city>/circle-rates/).
 */
export const RESERVED_CITY_IDS = [
  "hi",
  "projects",
  "guides",
  "tools",
  "updates",
  "about",
  "team",
  "methodology",
  "contact",
  "disclaimer",
  "privacy",
  "terms",
  "sitemap",
  "api",
] as const;
export const RESERVED_LOCALITY_IDS = ["circle-rates"] as const;
