/**
 * Enquiry form → JotForm submission proxy.
 *
 * Cloudflare Pages Function, served at /api/lead on the same origin as the site — no separate
 * Worker, no wrangler deploy, no secrets, ships with a normal `git push`. The transport it shares
 * with /api/subscribe lives in lib/jotform.ts.
 *
 * Two JotForm forms, one per EnquiryForm variant (components/EnquiryForm.tsx `variant` prop, sent
 * through as `payload.variant`):
 *   - "hero" → the short homepage form (name, phone, email, city, purpose)
 *   - "band" → the fuller form used on every data page (adds budget, location, message)
 *
 * Field names below were read off each live form's rendered HTML (view-source on the form's
 * form.jotform.com page) and verified against the live endpoint.
 */
import { json, submitToJotform } from "../../lib/jotform";

type Values = Record<string, string>;

const HERO = {
  formId: "262671761366060",
  field: { name: "q9_name", phone: "q10_phone", email: "q4_q4_email2", city: "q5_q5_textbox3", purpose: "q6_q6_radio4" },
  required: ["name", "phone", "email", "city", "purpose"] as const,
  label: { name: "Name", phone: "Phone", email: "Email", city: "City", purpose: "What are you looking for" } as Record<string, string>,
};

const BAND = {
  formId: "262702126696056",
  field: {
    name: "q2_q2_textbox0",
    phone: "q3_q3_textbox1",
    email: "q11_email",
    city: "q4_q4_dropdown2",
    budget: "q5_q5_dropdown3",
    purpose: "q6_q6_radio4",
    location: "q7_q7_radio5",
    message: "q8_q8_textarea6",
  },
  // message is optional on this JotForm form; the site requires it anyway (safe — see
  // docs/jotform-integration.md "the required-flag asymmetry"), so it's not in this list.
  required: ["name", "phone", "email", "city", "budget", "purpose", "location"] as const,
  label: {
    name: "Name",
    phone: "Phone",
    email: "Email",
    city: "City",
    budget: "Budget",
    purpose: "What are you looking for",
    location: "Where are you",
  } as Record<string, string>,
};

/* Both forms store city and purpose as locale-neutral slugs on the site (see lib/content.ts
   cityOptions/purposes/budgetOptions/locationOptions), translated to each form's own exact option
   text before sending. The two forms' option text is not identical (e.g. "Not sure" vs "Not Sure"),
   so each gets its own map rather than sharing one. */
const HERO_CITY_LABELS: Record<string, string> = { ayodhya: "Ayodhya", lucknow: "Lucknow", gorakhpur: "Gorakhpur", "not-sure": "Not sure" };
const HERO_PURPOSE_LABELS: Record<string, string> = {
  residential: "Residential plot",
  commercial: "Commercial land",
  investment: "Investment",
  agricultural: "Agricultural",
  "not-sure": "Not sure yet",
};

const BAND_CITY_LABELS: Record<string, string> = { ayodhya: "Ayodhya", lucknow: "Lucknow", gorakhpur: "Gorakhpur", "not-sure": "Not Sure" };
const BAND_PURPOSE_LABELS = HERO_PURPOSE_LABELS; // identical option text on both live forms
const BAND_BUDGET_LABELS: Record<string, string> = {
  "under-25": "Under ₹25 lakh",
  "25-50": "₹25–50 lakh",
  "50-100": "₹50 lakh–1 crore",
  "over-100": "Above ₹1 crore",
  "not-sure": "Not Sure",
};
const BAND_LOCATION_LABELS: Record<string, string> = { india: "In India", abroad: "Outside India" };

const MAX_LEN: Record<string, number> = { message: 2000 };
const MAX_LEN_DEFAULT = 200;

type Ctx = { request: Request };

/** Health check — confirms the Function is deployed and routed. */
export function onRequestGet(): Response {
  return json({ ok: true, service: "awadhland-lead" }, 200);
}

export async function onRequestPost({ request }: Ctx): Promise<Response> {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return json({ ok: false, error: "Expected a JSON body." }, 400);
  const body = payload as Record<string, unknown>;

  const str = (key: string) => {
    const v = body[key];
    if (typeof v !== "string") return "";
    return v.trim().slice(0, MAX_LEN[key] ?? MAX_LEN_DEFAULT);
  };

  // Honeypot: a real visitor never sees this input, so anything in it is a bot. Answer 200 so the
  // bot cannot tell it was filtered.
  if (str("website") !== "") return json({ ok: true }, 200);

  const isBand = body.variant === "band";
  const form = isBand ? BAND : HERO;

  const values: Values = {
    name: str("name"),
    phone: str("phone").replace(/[^\d+]/g, ""),
    email: str("email"),
    city: str("city"),
    purpose: str("purpose"),
    ...(isBand ? { budget: str("budget"), location: str("location"), message: str("message") } : {}),
  };

  if (values.name.length > 0 && values.name.length < 2) {
    return json({ ok: false, error: "Please check the name.", fields: ["name"] }, 400);
  }
  if (values.phone !== "" && !/^\+?\d{10,15}$/.test(values.phone)) {
    return json({ ok: false, error: "Please check the phone number.", fields: ["phone"] }, 400);
  }
  if (values.email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return json({ ok: false, error: "Please check the email address.", fields: ["email"] }, 400);
  }

  const missing = form.required.filter((k) => values[k] === "");
  if (missing.length > 0) {
    return json({ ok: false, error: `Please fill in: ${missing.map((k) => form.label[k]).join(", ")}.`, fields: missing }, 400);
  }

  const fields: [string, string][] = isBand
    ? [
        [BAND.field.name, values.name],
        [BAND.field.phone, values.phone],
        [BAND.field.email, values.email],
        [BAND.field.city, BAND_CITY_LABELS[values.city] ?? values.city],
        [BAND.field.budget, BAND_BUDGET_LABELS[values.budget] ?? values.budget],
        [BAND.field.purpose, BAND_PURPOSE_LABELS[values.purpose] ?? values.purpose],
        [BAND.field.location, BAND_LOCATION_LABELS[values.location] ?? values.location],
        ...(values.message ? ([[BAND.field.message, values.message]] as [string, string][]) : []),
      ]
    : [
        [HERO.field.name, values.name],
        [HERO.field.phone, values.phone],
        [HERO.field.email, values.email],
        [HERO.field.city, HERO_CITY_LABELS[values.city] ?? values.city],
        [HERO.field.purpose, HERO_PURPOSE_LABELS[values.purpose] ?? values.purpose],
      ];

  const result = await submitToJotform(form.formId, fields);

  if (result.ok) return json({ ok: true }, 200);
  const { status, ...rest } = result;
  return json(rest, status ?? 502);
}
