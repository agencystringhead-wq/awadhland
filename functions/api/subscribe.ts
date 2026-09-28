/**
 * Monthly digest signup → JotForm submission proxy.
 *
 * Cloudflare Pages Function, served at /api/subscribe. Sibling of /api/lead; the transport they
 * share lives in lib/jotform.ts.
 *
 * Disabled until a real digest JotForm form exists: fill in FORM_ID and FIELD below (see
 * functions/api/lead.ts for how to read them off a live form), then flip `digestReady` to true in
 * components/SubscribeForm.tsx so the form renders.
 */
import { json, submitToJotform } from "../../lib/jotform";

const FORM_ID = ""; // TODO: fill in once a digest JotForm form exists
const FIELD = { email: "", locale: "", page: "" }; // TODO: fill in

type Ctx = { request: Request };

export function onRequestGet(): Response {
  return json({ ok: true, service: "awadhland-subscribe" }, 200);
}

export async function onRequestPost({ request }: Ctx): Promise<Response> {
  if (!FORM_ID) return json({ ok: false, error: "disabled" }, 501);

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") return json({ ok: false, error: "Expected a JSON body." }, 400);
  const body = payload as Record<string, unknown>;

  const str = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim().slice(0, 200) : "");
  if (str("website") !== "") return json({ ok: true }, 200); // honeypot

  const email = str("email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "Please check the email address." }, 400);

  const result = await submitToJotform(FORM_ID, [
    [FIELD.email, email],
    [FIELD.locale, str("locale")],
    [FIELD.page, str("page")],
  ]);

  if (result.ok) return json({ ok: true }, 200);
  const { status, ...rest } = result;
  return json(rest, status ?? 502);
}
