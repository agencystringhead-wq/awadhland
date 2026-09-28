/**
 * Shared JotForm transport for the Cloudflare Pages Functions in /functions.
 *
 * SERVER-SIDE ONLY. Nothing under app/ or components/ may import this — it lives in lib/ rather
 * than under /functions so that Pages cannot mistake it for a route, not because it is site code.
 *
 * What belongs here: the rules that are identical for every form on the account — the endpoint,
 * the anti-spam fields, and how to read a reply. What does NOT belong here: field names, labels,
 * validation. Those are per-form and live in the Function that owns the form.
 *
 * Same method as the toronto-hair and floridatreepro reference projects (public submit endpoint,
 * no API key), refined with the fix below after finding it undocumented in both: this endpoint can
 * silently drop a submission behind a spam check unless a specific hidden field is sent correctly.
 */

export type JotformResult =
  | { ok: true }
  | { ok: false; error: string; status?: number; reason?: string; detail?: string; snippet?: string };

/** JSON response with the no-store header every endpoint here wants. */
export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * Post to a form's public submit endpoint — the same URL the JotForm-hosted page uses.
 * Unauthenticated; no API key is involved.
 *
 * `fields` is an array of [name, value] pairs rather than an object so a checkbox group can repeat
 * its `q{n}_{name}[]` key once per selection.
 *
 * Resolves to {ok: true} or {ok: false, error, ...}; it never throws.
 */
export async function submitToJotform(formId: string, fields: [string, string][]): Promise<JotformResult> {
  const outbound = new FormData();
  outbound.append("formID", formId);
  for (const [name, value] of fields) outbound.append(name, value);
  // JotForm's own honeypot ("Should be Empty" on the hosted page) — always sent, always empty.
  outbound.append("website", "");
  // JotForm's "simple spam check": the page ships `simple_spc` as the bare form id and its
  // JavaScript rewrites it to `{id}-{id}` before submitting. The endpoint reads the un-rewritten
  // value as "no JS ran" and answers with a CAPTCHA challenge page, storing nothing. This doubled
  // value is REQUIRED, not decorative — verified on the live form.
  outbound.append("simple_spc", `${formId}-${formId}`);

  let upstream: Response;
  try {
    upstream = await fetch(`https://submit.jotform.com/submit/${formId}`, {
      method: "POST",
      body: outbound,
      // A 3xx to the thank-you page is a success signal in its own right — don't let fetch
      // swallow it by following the redirect.
      redirect: "manual",
    });
  } catch (err) {
    return { ok: false, error: "Could not reach JotForm.", status: 502, detail: String(err) };
  }

  if (upstream.status >= 300 && upstream.status < 400) return { ok: true };

  const body = await upstream.text().catch(() => "");

  if (upstream.status === 200) {
    // Three shapes come back with a 200: the thank-you page (recorded), the CAPTCHA challenge
    // (held, NOT recorded — see simple_spc above), and anything else, treated as a failure rather
    // than guessed about.
    if (/initCaptcha|correctCaptcha/i.test(body)) {
      return { ok: false, error: "JotForm held the submission for a spam check.", reason: "captcha", status: 502 };
    }
    if (/submission has been received|<title>\s*Thank You/i.test(body)) return { ok: true };
    return { ok: false, error: "JotForm returned an unexpected response.", status: 502, snippet: body.slice(0, 300) };
  }

  // 400 "Incomplete Values" means a field name or a required value drifted from the live form —
  // a code problem, not a visitor problem.
  return { ok: false, error: `JotForm rejected the submission (HTTP ${upstream.status}).`, status: 502, snippet: body.slice(0, 300) };
}
