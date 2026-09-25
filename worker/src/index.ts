/**
 * awadhland lead worker (step 7). Deployed separately with wrangler from worker/.
 *
 * Routes (POST, JSON, CORS-restricted to ALLOWED_ORIGINS):
 *   /lead       enquiry from the hero card, the lead-form band and every LeadForm block →
 *               validated, then created as a JotForm submission via the JotForm API. The site never
 *               loads JotForm's script; the form is ours and only the submission goes to JotForm.
 *   /subscribe  monthly digest email → a second JotForm form.
 *   /event      first-party analytics beacon (event, path, locale, small meta), written to a
 *               Workers Analytics Engine dataset. No cookies, no IP stored, no third-party script.
 *
 * Secrets and vars are set with `wrangler secret put` / wrangler.toml (see worker/README.md).
 */

type AnalyticsEngineDataset = { writeDataPoint(p: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void };
type ExecutionContext = { waitUntil(p: Promise<unknown>): void };

export interface Env {
  /** comma-separated, e.g. "https://awadhland.com,https://www.awadhland.com" */
  ALLOWED_ORIGINS: string;
  JOTFORM_API_KEY: string;
  JOTFORM_LEAD_FORM_ID: string;
  /** JSON: our field name → JotForm question id path, e.g. {"name":"3[first]","phone":"4[full]","city":"5"} */
  JOTFORM_LEAD_FIELDS: string;
  JOTFORM_DIGEST_FORM_ID?: string;
  JOTFORM_DIGEST_FIELDS?: string;
  LEAD_EVENTS?: AnalyticsEngineDataset;
}

const MAX_BODY = 8 * 1024;
const LEAD_FIELDS = ["name", "phone", "email", "city", "purpose", "budget", "location", "message", "locality", "context", "page", "locale"] as const;
const EVENTS = new Set(["lead_submit", "lead_fail", "whatsapp_click", "call_click", "digest_subscribe", "checklist_download"]);

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

/** Creates a JotForm submission. fields maps our names to "qid" or "qid[sub]" paths. */
async function jotform(env: Env, formId: string, fieldsJson: string, values: Record<string, string>): Promise<Response> {
  const map = JSON.parse(fieldsJson) as Record<string, string>;
  const form = new URLSearchParams();
  for (const [ours, path] of Object.entries(map)) {
    if (values[ours] === undefined || values[ours] === "") continue;
    form.set(`submission[${path}]`, values[ours]);
  }
  return fetch(`https://api.jotform.com/form/${formId}/submissions`, {
    method: "POST",
    headers: { APIKEY: env.JOTFORM_API_KEY, "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
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
      const res = await jotform(env, env.JOTFORM_LEAD_FORM_ID, env.JOTFORM_LEAD_FIELDS, v.lead);
      const ok = res.ok;
      ctx.waitUntil(Promise.resolve(track(env, ok ? "lead_submit" : "lead_fail", v.lead.page, v.lead.locale, `${v.lead.city}:${v.lead.purpose}`)));
      if (!ok) return json({ ok: false, error: "upstream" }, 502, cors);
      return json({ ok: true }, 200, cors);
    }

    if (url.pathname === "/subscribe") {
      if (!env.JOTFORM_DIGEST_FORM_ID || !env.JOTFORM_DIGEST_FIELDS) return json({ ok: false, error: "disabled" }, 501, cors);
      if (clean(body.website)) return json({ ok: true }, 200, cors);
      const email = clean(body.email, 200);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "email" }, 422, cors);
      const res = await jotform(env, env.JOTFORM_DIGEST_FORM_ID, env.JOTFORM_DIGEST_FIELDS, { email, locale: clean(body.locale, 5), page: clean(body.page, 200) });
      ctx.waitUntil(Promise.resolve(track(env, "digest_subscribe", clean(body.page, 200), clean(body.locale, 5), res.ok ? "ok" : "fail")));
      if (!res.ok) return json({ ok: false, error: "upstream" }, 502, cors);
      return json({ ok: true }, 200, cors);
    }

    return json({ ok: false, error: "not-found" }, 404, cors);
  },
};

export default worker;
