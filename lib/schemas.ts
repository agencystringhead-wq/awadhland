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
    circleRate: circleRateOnLocalitySchema.optional(),
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
    fit: z
      .object({
        residential: fitEntrySchema,
        commercial: fitEntrySchema,
        investment: fitEntrySchema,
      })
      .strict()
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
    score: z.number().int().min(0).max(100).optional(),
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

export type Source = z.infer<typeof source>;
export type City = z.infer<typeof citySchema>;
export type Anchor = z.infer<typeof anchorSchema>;
export type Locality = z.infer<typeof localitySchema>;
export type Project = z.infer<typeof projectSchema>;
export type CircleRateSchedule = z.infer<typeof circleRateScheduleSchema>;
export type CircleRateRow = z.infer<typeof circleRateRowSchema>;
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
export const dataFiles = {
  "cities.json": citiesFileSchema,
  "localities.json": localitiesFileSchema,
  "projects.json": projectsFileSchema,
  "circleRates.json": circleRatesFileSchema,
  "stampDutyRules.json": stampDutyRulesFileSchema,
  "updates.json": updatesFileSchema,
  "priceObservations.json": priceObservationsFileSchema,
  "team.json": teamFileSchema,
  "scoring.json": scoringSchema,
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
