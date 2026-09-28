# awadhland-leads worker

The site is a static export; this Worker is the only server-side piece. It takes enquiry and digest forms from the site, validates them, and forwards each as a JotForm submission through the form's own public submit endpoint (`https://submit.jotform.com/submit/{formId}`), the same URL a browser hits when a visitor fills out the JotForm-hosted page directly. That endpoint is public and unauthenticated, so no JotForm API key is stored or needed anywhere. No JotForm script ever loads on the site. It also records first-party analytics events.

## Endpoints

| Route | Body | Does |
| --- | --- | --- |
| `POST /lead` | `{ name, phone, email?, city, purpose, budget?, location?, message?, locality?, context?, page, locale, website: "" }` | Validates (honeypot `website` must be empty, phone 10–15 digits, city required), creates a submission on the lead form, records `lead_submit` or `lead_fail` |
| `POST /subscribe` | `{ email, page, locale, website: "" }` | Creates a submission on the digest form, records `digest_subscribe` |
| `POST /event` | `{ event, path, locale, meta? }` | Writes one data point to Analytics Engine. Events: `lead_submit`, `lead_fail`, `whatsapp_click`, `call_click`, `digest_subscribe`, `checklist_download` |

All routes require an `Origin` in `ALLOWED_ORIGINS`; anything else is 403. Bodies over 8 KB are rejected.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

No secrets to set: JotForm's submit endpoint needs no API key. `wrangler.toml` already has `JOTFORM_LEAD_FORM_ID` and `JOTFORM_LEAD_FIELDS` filled in for the live hero enquiry form. Uncomment `routes` with the custom domain (`lead.awadhland.com`) before deploying to production, then set `NEXT_PUBLIC_LEAD_ENDPOINT=https://lead.awadhland.com` in the Cloudflare Pages build environment so the site posts to it. Without that variable the site's forms fall back to composing a WhatsApp message and analytics is a no-op.

### Wiring a new or changed JotForm form

No JotForm account or API key required, just the form's own public page:

1. Open the form's `form.jotform.com/{id}` URL and view its page source (or a browser's element inspector).
2. For each field, find its rendered `<input>`/`<select>`/`<textarea>` and read the `name="q{QID}_..."` attribute exactly as written — that whole string is the "real input name".
3. Set `JOTFORM_LEAD_FORM_ID` to the id from the URL, and `JOTFORM_LEAD_FIELDS` to a JSON map from our field name to each real input name, e.g. `{"name":"q9_name","phone":"q10_phone"}`.
4. If a radio or checkbox field's option text differs from the site's own labels (or the site sends a locale-neutral slug, as city/purpose do), add a translation table in `worker/src/index.ts` near `CITY_LABELS`/`PURPOSE_LABELS` so the value sent matches the option text on the form exactly.
5. **Every field marked required on the live JotForm form must be present in every submission the Worker can send, or JotForm rejects it.** The current form (`262671761366060`) marks Name, Phone, Email, City and "What are you looking for" all required, and `components/EnquiryForm.tsx` now collects and requires all five in both the hero and "band" variants (so every page, not just the homepage), matching this form exactly. If a future JotForm form adds a required field the site doesn't collect, that field's submissions will fail upstream until the site form is updated to match (it still falls back to WhatsApp either way, so no enquiry is lost).

## Rate limiting

Add a Cloudflare WAF rate-limiting rule on the worker route (for example 10 requests per minute per IP on `/lead`). The worker itself only applies the honeypot, size and origin checks.

## Analytics

`LEAD_EVENTS` is a Workers Analytics Engine dataset (`awadhland_lead_events`): blobs are `[event, path, locale, meta]`, index is `event`. Query it with the Analytics Engine SQL API or the dashboard. Nothing personal is written: no name, phone, email or IP.

Page-view analytics stays out of the site by the house rule (no third-party scripts). If page views are wanted, enable Cloudflare Web Analytics on the Pages project in the dashboard; that injects Cloudflare's beacon at the edge and is a decision to take there, not in this repo.
