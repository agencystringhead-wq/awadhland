/**
 * Client-side lead and analytics helpers (step 7). The endpoint is the awadhland-leads Worker
 * (worker/), read from NEXT_PUBLIC_LEAD_ENDPOINT at build. When it is unset the forms fall back
 * to composing a WhatsApp message and tracking is a no-op, so a preview build never posts anywhere.
 * Nothing here runs at build; every function is called from client components.
 */
export const LEAD_ENDPOINT = (process.env.NEXT_PUBLIC_LEAD_ENDPOINT ?? "").replace(/\/$/, "");
export const leadsEnabled = LEAD_ENDPOINT.length > 0;

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

export type LeadEvent = "lead_submit" | "lead_fail" | "whatsapp_click" | "call_click" | "digest_subscribe";

async function post(path: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${LEAD_ENDPOINT}${path}`, {
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

export const submitLead = (payload: LeadPayload) => post("/lead", payload);
export const subscribeDigest = (email: string, locale: string, page: string) => post("/subscribe", { email, locale, page, website: "" });

/**
 * Fire-and-forget beacon. Sends event, path and locale only; no personal data. The body goes as
 * text/plain because browsers refuse cross-origin sendBeacon with a JSON content type; the Worker
 * parses the JSON regardless of the declared type.
 */
export function track(event: LeadEvent, locale: string, meta = ""): void {
  if (!leadsEnabled || typeof window === "undefined") return;
  const body = JSON.stringify({ event, path: window.location.pathname, locale, meta });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(`${LEAD_ENDPOINT}/event`, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
  } catch {
    /* fall through */
  }
  void fetch(`${LEAD_ENDPOINT}/event`, { method: "POST", headers: { "content-type": "text/plain;charset=UTF-8" }, body, keepalive: true }).catch(() => {});
}
