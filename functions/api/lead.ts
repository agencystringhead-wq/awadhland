/**
 * Enquiry form → JotForm submission proxy.
 *
 * Cloudflare Pages Function, served at /api/lead on the same origin as the site — no separate
 * Worker, no wrangler deploy, no secrets, ships with a normal `git push`. The transport it shares
 * with /api/subscribe lives in lib/jotform.ts.
 *
 * Field names below were read off the live form's rendered HTML (view-source on
 * https://form.jotform.com/262671761366060) and verified against the live endpoint.
 */
import { json, submitToJotform } from "../../lib/jotform";

const FORM_ID = "262671761366060";

/* Site field → JotForm input name (`q{QID}_{name}`, from the live form's rendered HTML). QIDs are
   not sequential with the on-screen order. */
const FIELD = {
  name: "q9_name",
  phone: "q10_phone",
  email: "q4_q4_email2",
  city: "q5_q5_textbox3",
  purpose: "q6_q6_radio4",
};

/* This form's city field is free text and its purpose field is a fixed radio list. The site
   stores both as locale-neutral slugs (see lib/content.ts cityOptions/purposes); JotForm gets the
   canonical English label instead, matching the exact option text on the live form regardless of
   which locale the visitor submitted from. */
const CITY_LABELS: Record<string, string> = { ayodhya: "Ayodhya", lucknow: "Lucknow", gorakhpur: "Gorakhpur", "not-sure": "Not sure" };
const PURPOSE_LABELS: Record<string, string> = {
  residential: "Residential plot",
  commercial: "Commercial land",
  investment: "Investment",
  agricultural: "Agricultural",
  "not-sure": "Not sure yet",
};

/* Every field here is required, on the live JotForm form and on the site
   (components/EnquiryForm.tsx marks all five required in both variants). Sending an empty one
   comes back as HTTP 400 "Incomplete Values". */
const REQUIRED = ["name", "phone", "email", "city", "purpose"] as const;

const LABEL: Record<string, string> = { name: "Name", phone: "Phone", email: "Email", city: "City", purpose: "What are you looking for" };

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

  const values = {
    name: str("name"),
    phone: str("phone").replace(/[^\d+]/g, ""),
    email: str("email"),
    city: str("city"),
    purpose: str("purpose"),
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

  const missing = REQUIRED.filter((k) => values[k] === "");
  if (missing.length > 0) {
    return json({ ok: false, error: `Please fill in: ${missing.map((k) => LABEL[k]).join(", ")}.`, fields: missing }, 400);
  }

  const result = await submitToJotform(FORM_ID, [
    [FIELD.name, values.name],
    [FIELD.phone, values.phone],
    [FIELD.email, values.email],
    [FIELD.city, CITY_LABELS[values.city] ?? values.city],
    [FIELD.purpose, PURPOSE_LABELS[values.purpose] ?? values.purpose],
  ]);

  if (result.ok) return json({ ok: true }, 200);
  const { status, ...rest } = result;
  return json(rest, status ?? 502);
}
