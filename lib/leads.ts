/**
 * Client-side lead helpers. Posts to same-origin Cloudflare Pages Functions (functions/api/lead.ts,
 * functions/api/subscribe.ts) — no separate Worker, no endpoint to configure. Those Functions only
 * run on a real Cloudflare deploy, not under `next dev`, so a local run gets a 404 and the form
 * shows its normal failure state; the enquiry form still always opens WhatsApp regardless, so no
 * enquiry is lost either way. Nothing here runs at build; every function is called from client
 * components.
 */
export type LeadPayload = {
  kind: "lead";
  locale: string;
  page: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  purpose: string;
  budget?: string;
  location?: string;
  message?: string;
  locality?: string;
  context?: string;
  /** honeypot, must stay empty */
  website: string;
};

async function post(path: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    return { ok: res.ok && data.ok === true, error: data.error };
  } catch {
    return { ok: false, error: "network" };
  }
}

export const submitLead = (payload: LeadPayload) => post("/api/lead", payload);
export const subscribeDigest = (email: string, locale: string, page: string) => post("/api/subscribe", { email, locale, page, website: "" });
