/**
 * awadhland lead worker (step 7). Deployed separately with wrangler from worker/.
 *
 * Routes (POST, JSON, CORS-restricted to ALLOWED_ORIGINS):
 *   /lead       enquiry from the hero card, the lead-form band and every LeadForm block →
 *               validated, then forwarded as a JotForm submission. The site never loads JotForm's
 *               script; the form is ours and only the submission goes to JotForm.
 *   /subscribe  monthly digest email → a second JotForm form.
 *   /event      first-party analytics beacon (event, path, locale, small meta), written to a
 *               Workers Analytics Engine dataset. No cookies, no IP stored, no third-party script.
 *
 * JotForm transport: submissions go to the form's own public submit endpoint
 * (https://submit.jotform.com/submit/{formId}), the same URL a browser hits when a visitor fills
 * out the JotForm-hosted page directly. That endpoint is public/unauthenticated — no API key is
 * sent or required. Field keys are the form's real input names (q{QID}_{name}, read off the live
 * form's rendered HTML, e.g. view-source on the form's JotForm page), not the JOTFORM_API `submission[qid]`
 * shape. See worker/README.md for how to read them off a new form.
 *
 * Vars are set in wrangler.toml (see worker/README.md).
 */

type AnalyticsEngineDataset = { writeDataPoint(p: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void };
type ExecutionContext = { waitUntil(p: Promise<unknown>): void };

export interface Env {
  /** comma-separated, e.g. "https://awadhland.com,https://www.awadhland.com" */
  ALLOWED_ORIGINS: string;
  JOTFORM_LEAD_FORM_ID: string;
  /** JSON: our field name → the form's real input name, e.g. {"name":"q9_name","phone":"q10_phone"} */
  JOTFORM_LEAD_FIELDS: string;
  JOTFORM_DIGEST_FORM_ID?: string;
  JOTFORM_DIGEST_FIELDS?: string;
  LEAD_EVENTS?: AnalyticsEngineDataset;
}

const MAX_BODY = 8 * 1024;
const LEAD_FIELDS = ["name", "phone", "email", "city", "purpose", "budget", "location", "message", "locality", "context", "page", "locale"] as const;
const EVENTS = new Set(["lead_submit", "lead_fail", "whatsapp_click", "call_click", "digest_subscribe", "checklist_download"]);

// This JotForm's city field is free text and its purpose field is a fixed radio list. The site
// stores both as locale-neutral slugs (see lib/content.ts cityOptions/purposes); JotForm gets the
// canonical English label instead, matching the exact option text on the live form regardless of
// which locale the visitor submitted from.
const CITY_LABELS: Record<string, string> = { ayodhya: "Ayodhya", lucknow: "Lucknow", gorakhpur: "Gorakhpur", "not-sure": "Not sure" };
const PURPOSE_LABELS: Record<string, string> = {
  residential: "Residential plot",
  commercial: "Commercial land",
  investment: "Investment",
  agricultural: "Agricultural",
  "not-sure": "Not sure yet",
};

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

function corsHeaders(req: Request, env: Env): Record<string, string> | null {
  const origin = req.headers.get("origin") ?? "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return null;
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

function validateLead(body: Record<string, unknown>): { ok: true; lead: Record<string, string> } | { ok: false; error: string } {
  if (clean(body.website)) return { ok: false, error: "spam" }; // honeypot
  const lead: Record<string, string> = {};
  for (const f of LEAD_FIELDS) lead[f] = clean(body[f], f === "message" ? 2000 : 200);
  if (lead.name.length < 2) return { ok: false, error: "name" };
  const digits = lead.phone.replace(/[^\d+]/g, "");
  if (!/^\+?\d{10,15}$/.test(digits)) return { ok: false, error: "phone" };
  lead.phone = digits;
  if (lead.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) return { ok: false, error: "email" };
  if (!lead.city) return { ok: false, error: "city" };
  return { ok: true, lead };
}

/**
 * Submits to the form's public submit endpoint. fields maps our field name to the form's real
 * input name (e.g. "q9_name"); values not present in the map, or empty, are left out. No API key:
 * this is the same unauthenticated URL the JotForm-hosted page itself posts to.
 */
async function jotform(formId: string, fieldsJson: string, values: Record<string, string>): Promise<Response> {
  const map = JSON.parse(fieldsJson) as Record<string, string>;
  const body = new FormData();
  for (const [ours, inputName] of Object.entries(map)) {
    if (values[ours]) body.append(inputName, values[ours]);
  }
  // redirect: "manual" so a 3xx to the Thank-You page reads as a 3xx (success) instead of being
  // auto-followed; submit.jotform.com returns 2xx/3xx on acceptance, no JSON body either way.
  return fetch(`https://submit.jotform.com/submit/${formId}`, { method: "POST", body, redirect: "manual" });
}

function track(env: Env, event: string, path: string, locale: string, meta: string) {
  env.LEAD_EVENTS?.writeDataPoint({ blobs: [event, path.slice(0, 200), locale.slice(0, 5), meta.slice(0, 100)], doubles: [1], indexes: [event] });
}

const worker = {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(req, env);
    if (req.method === "OPTIONS") return cors ? new Response(null, { status: 204, headers: cors }) : new Response(null, { status: 403 });
    if (!cors) return json({ ok: false, error: "origin" }, 403);
    if (req.method !== "POST") return json({ ok: false, error: "method" }, 405, cors);
    const len = Number(req.headers.get("content-length") ?? "0");
    if (len > MAX_BODY) return json({ ok: false, error: "too-large" }, 413, cors);

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: "json" }, 400, cors);
    }
    const url = new URL(req.url);

    if (url.pathname === "/event") {
      const event = clean(body.event, 40);
      if (!EVENTS.has(event)) return json({ ok: false, error: "event" }, 400, cors);
      track(env, event, clean(body.path, 200), clean(body.locale, 5), clean(body.meta, 100));
      return json({ ok: true }, 200, cors);
    }

    if (url.pathname === "/lead") {
      const v = validateLead(body);
      // A honeypot hit is answered like a success so bots learn nothing; nothing is forwarded.
      if (!v.ok) return v.error === "spam" ? json({ ok: true }, 200, cors) : json({ ok: false, error: v.error }, 422, cors);
      // JotForm gets the canonical English label for city/purpose (see CITY_LABELS/PURPOSE_LABELS);
      // analytics below still uses the raw slug, which stays locale-neutral.
      const forJotform = { ...v.lead, city: CITY_LABELS[v.lead.city] ?? v.lead.city, purpose: PURPOSE_LABELS[v.lead.purpose] ?? v.lead.purpose };
      const res = await jotform(env.JOTFORM_LEAD_FORM_ID, env.JOTFORM_LEAD_FIELDS, forJotform);
      const ok = res.status >= 200 && res.status < 400;
      ctx.waitUntil(Promise.resolve(track(env, ok ? "lead_submit" : "lead_fail", v.lead.page, v.lead.locale, `${v.lead.city}:${v.lead.purpose}`)));
      if (!ok) return json({ ok: false, error: "upstream" }, 502, cors);
      return json({ ok: true }, 200, cors);
    }

    if (url.pathname === "/subscribe") {
      if (!env.JOTFORM_DIGEST_FORM_ID || !env.JOTFORM_DIGEST_FIELDS) return json({ ok: false, error: "disabled" }, 501, cors);
      if (clean(body.website)) return json({ ok: true }, 200, cors);
      const email = clean(body.email, 200);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "email" }, 422, cors);
      const res = await jotform(env.JOTFORM_DIGEST_FORM_ID, env.JOTFORM_DIGEST_FIELDS, { email, locale: clean(body.locale, 5), page: clean(body.page, 200) });
      const ok = res.status >= 200 && res.status < 400;
      ctx.waitUntil(Promise.resolve(track(env, "digest_subscribe", clean(body.page, 200), clean(body.locale, 5), ok ? "ok" : "fail")));
      if (!ok) return json({ ok: false, error: "upstream" }, 502, cors);
      return json({ ok: true }, 200, cors);
    }

    return json({ ok: false, error: "not-found" }, 404, cors);
  },
};

export default worker;
