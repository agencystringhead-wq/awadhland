# awadhland-leads worker

The site is a static export; this Worker is the only server-side piece. It takes enquiry and digest forms from the site, validates them, and creates JotForm submissions through JotForm's API, so no JotForm script ever loads on the site. It also records first-party analytics events.

## Endpoints

| Route | Body | Does |
| --- | --- | --- |
| `POST /lead` | `{ name, phone, email?, city, purpose, budget?, location?, message?, locality?, context?, page, locale, website: "" }` | Validates (honeypot `website` must be empty, phone 10–15 digits, city required), creates a submission on the lead form, records `lead_submit` or `lead_fail` |
| `POST /subscribe` | `{ email, page, locale, website: "" }` | Creates a submission on the digest form, records `digest_subscribe` |
| `POST /event` | `{ event, path, locale, meta? }` | Writes one data point to Analytics Engine. Events: `lead_submit`, `lead_fail`, `whatsapp_click`, `call_click`, `digest_subscribe` |

All routes require an `Origin` in `ALLOWED_ORIGINS`; anything else is 403. Bodies over 8 KB are rejected.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler secret put JOTFORM_API_KEY
npx wrangler deploy
```

Then in `wrangler.toml`: set `JOTFORM_LEAD_FORM_ID` and the `JOTFORM_LEAD_FIELDS` map (question ids from the JotForm form's "Get form questions" API), optionally the digest form, and uncomment `routes` with the custom domain (`lead.awadhland.com`). Set `NEXT_PUBLIC_LEAD_ENDPOINT=https://lead.awadhland.com` in the Cloudflare Pages build environment so the site posts to it. Without that variable the site's forms fall back to composing a WhatsApp message and analytics is a no-op.

## Rate limiting

Add a Cloudflare WAF rate-limiting rule on the worker route (for example 10 requests per minute per IP on `/lead`). The worker itself only applies the honeypot, size and origin checks.

## Analytics

`LEAD_EVENTS` is a Workers Analytics Engine dataset (`awadhland_lead_events`): blobs are `[event, path, locale, meta]`, index is `event`. Query it with the Analytics Engine SQL API or the dashboard. Nothing personal is written: no name, phone, email or IP.

Page-view analytics stays out of the site by the house rule (no third-party scripts). If page views are wanted, enable Cloudflare Web Analytics on the Pages project in the dashboard; that injects Cloudflare's beacon at the edge and is a decision to take there, not in this repo.
