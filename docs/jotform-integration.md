# JotForm integration

The enquiry form posts to a Cloudflare Pages Function. It routes to one of two JotForm forms
depending on which `EnquiryForm` variant submitted (`payload.variant`, see
`components/EnquiryForm.tsx`):

| Site form | Rendered on | Endpoint | Function | JotForm |
|---|---|---|---|---|
| `components/EnquiryForm.tsx`, `variant="hero"` | homepage only | `/api/lead` | `functions/api/lead.ts` | [`262671761366060`](https://form.jotform.com/262671761366060) |
| `components/EnquiryForm.tsx`, `variant="band"` (via `LeadForm`) | every other page | `/api/lead` | `functions/api/lead.ts` | [`262702126696056`](https://form.jotform.com/262702126696056) |
| `components/SubscribeForm.tsx` (updates index) | `/updates` | `/api/subscribe` | `functions/api/subscribe.ts` | not yet configured — see that file |

The transport they share — endpoint, anti-spam fields, reading the reply — is in `lib/jotform.ts`.
Field names, labels and validation are per-form and stay in the Function that owns the form.

Everything below was read off the live form and verified against the live endpoint. No API key
exists anywhere in this integration, the submit endpoint is public. Same method as the
toronto-hair and floridatreepro reference projects; this repo previously used a standalone
Cloudflare Worker for it — deleted in favour of this simpler, git-push-only approach.

---

## Why there is a proxy

The site is a static export (`output: "export"` in `next.config.ts`), so there is no Next.js
server. `submit.jotform.com` returns no CORS headers, so a browser can post to it but can never
read the reply, a form would have no way to know whether a submission landed.

A **Cloudflare Pages Function** fills the gap. Pages picks up the `/functions` directory
automatically on deploy, so this ships with a normal `git push`, no Worker, no `wrangler`, no
secrets to set.

`lib/jotform.ts` sits outside `/functions` deliberately: anything inside that directory becomes a
route, and the shared transport is not one.

## Transport

Submissions go to the form's real submit endpoint, the same one the JotForm-hosted page posts to:

```
POST https://submit.jotform.com/submit/{formId}
Content-Type: multipart/form-data
```

Field keys are the form's real input names, `q{QID}_{name}`. **The QIDs do not follow the
on-screen order.** Alongside the fields, every submission carries:

| Key | Value |
|---|---|
| `formID` | the form id |
| `website` | empty, JotForm's own honeypot ("Should be Empty") |
| `simple_spc` | `{formId}-{formId}`, see below |

## ⚠ `simple_spc`, the non-obvious part

JotForm's "simple spam check". The page ships this hidden input as the bare form id and its
JavaScript rewrites it to `{id}-{id}` before submitting. The endpoint reads the un-rewritten value
as "no JavaScript ran" and answers with a **CAPTCHA challenge page**, HTTP 200, titled "Please
Complete", instead of recording anything. The submission is held, not stored.

Sending the doubled value is the difference between a recorded submission and a silently dropped
one. It is required, not decorative.

## Response shapes

| Upstream | Meaning | Function returns |
|---|---|---|
| 3xx | redirect to thank-you page, recorded | `200 {ok:true}` |
| 200, body contains "submission has been received" / `<title>Thank You` | recorded | `200 {ok:true}` |
| 200, body contains `initCaptcha` / `correctCaptcha` | held for spam check, **not** recorded | `502 {ok:false, reason:"captcha"}` |
| 400, `<title>Incomplete Values` | a required field was empty or a field name drifted | `502 {ok:false}` |

There is no JSON and no submission id in any reply, the returned page is the only success signal
available.

---

## Form 1 — hero, the homepage's short form (`262671761366060`)

| Site field | JotForm input name | Label | Required by JotForm | Required by site |
|---|---|---|---|---|
| `name` | `q9_name` | Name | **yes** | **yes** |
| `phone` | `q10_phone` | Phone | **yes** | **yes** |
| `email` | `q4_q4_email2` | Email | **yes** | **yes** |
| `city` | `q5_q5_textbox3` | City | **yes** | **yes** |
| `purpose` | `q6_q6_radio4` | What are you looking for | **yes** | **yes** |

- **City and purpose are locale-neutral slugs on the site** (`ayodhya`, `residential`, …, see
  `lib/content.ts` `cityOptions`/`purposes`), translated to the canonical English label before
  sending, so a Hindi-page submission still lands as readable English on the form, matching its
  exact option text. See `HERO_CITY_LABELS`/`HERO_PURPOSE_LABELS` in `functions/api/lead.ts`.
- This form has no field for `budget`, `location` or `message`, the "band" variant (form 2 below)
  collects those.
- City here is a **free-text field**, not a real dropdown, so nothing stops an unmatched value
  from being sent, it just won't read as cleanly. The translation table still matters for that
  reason even without JotForm enforcing it.

## Form 2 — band, the fuller form used on every other page (`262702126696056`)

| Site field | JotForm input name | Label | Required by JotForm | Required by site |
|---|---|---|---|---|
| `name` | `q2_q2_textbox0` | Your Name | **yes** | **yes** |
| `phone` | `q3_q3_textbox1` | Phone | **yes** | **yes** |
| `email` | `q11_email` | Email | **yes** | **yes** |
| `city` | `q4_q4_dropdown2` | City | **yes** | **yes** |
| `budget` | `q5_q5_dropdown3` | Budget | **yes** | **yes** |
| `purpose` | `q6_q6_radio4` | What are you looking for | **yes** | **yes** |
| `location` | `q7_q7_radio5` | Where are you | **yes** | **yes** |
| `message` | `q8_q8_textarea6` | Anything else | no | **yes** |

- **City and budget here are real `<select>` dropdowns**, unlike form 1's free-text city field.
  Their option values are `Ayodhya`/`Lucknow`/`Gorakhpur`/`Not Sure` and `Under ₹25 lakh`/
  `₹25–50 lakh`/`₹50 lakh–1 crore`/`Above ₹1 crore`/`Not Sure` — **not the same text as the site's
  own labels or as form 1's options** (e.g. this form's "Not Sure" vs form 1's "Not sure", this
  form's "Above ₹1 crore" vs the site's own "Over ₹1 crore"). Translated via
  `BAND_CITY_LABELS`/`BAND_BUDGET_LABELS`/`BAND_LOCATION_LABELS` in `functions/api/lead.ts` — do
  not assume the two forms' label maps are interchangeable, they were verified separately and
  differ in wording and casing.
- Purpose's option text is identical to form 1's, so `functions/api/lead.ts` reuses that same map
  rather than duplicating it, everything else here has its own.
- `message` is optional on JotForm but required by the site (safe, see "the required-flag
  asymmetry" below) — only sent when non-empty, so an empty message never reaches JotForm as a
  blank field.

## The required-flag asymmetry

Safe in one direction only. Requiring **more** than JotForm does costs nothing. Requiring **less**
means an empty value reaches a field JotForm requires, which comes back as HTTP 400 "Incomplete
Values" and a failed submission. Keep the Function's required list a superset of the form's own
required fields.

## Testing

Health check (confirms the Function is deployed and routed):

```bash
curl https://awadhland.com/api/lead
```

End-to-end, which creates a real submission in the JotForm inbox — one curl per form, since
`variant` decides which form the Function forwards to:

```bash
# form 1 — hero
curl -X POST https://awadhland.com/api/lead -H "Content-Type: application/json" -d "{\"variant\":\"hero\",\"name\":\"TEST\",\"phone\":\"+919876543210\",\"email\":\"test@example.com\",\"city\":\"ayodhya\",\"purpose\":\"residential\"}"

# form 2 — band
curl -X POST https://awadhland.com/api/lead -H "Content-Type: application/json" -d "{\"variant\":\"band\",\"name\":\"TEST\",\"phone\":\"+919876543210\",\"email\":\"test@example.com\",\"city\":\"ayodhya\",\"budget\":\"under-25\",\"purpose\":\"residential\",\"location\":\"india\",\"message\":\"test\"}"
```

`npm run dev` does **not** run Pages Functions, so `/api/lead` 404s locally under `next dev` and
the enquiry form shows its failure state (WhatsApp still opens regardless). Test against a
preview deployment, or with `npx wrangler pages dev out` after `npm run build`.

## Wiring a new or changed JotForm form

No JotForm account or API key required, just the form's own public page:

1. Open the form's `form.jotform.com/{id}` URL and view its page source (or a browser's element
   inspector).
2. For each field, find its rendered `<input>`/`<select>`/`<textarea>` and read the
   `name="q{QID}_..."` attribute exactly as written, that whole string is the "real input name".
3. Update the Function's `FORM_ID` and `FIELD` map to match.
4. If a radio or checkbox field's option text differs from the site's own labels (or the site
   sends a locale-neutral slug, as city/purpose do), add a translation table like
   `CITY_LABELS`/`PURPOSE_LABELS`.
5. Every field JotForm marks required must be present in every submission the Function can send,
   or JotForm rejects it (see "the required-flag asymmetry" above).

## If submissions stop arriving

1. `curl` the health check, if it 404s, the Function did not deploy.
2. Post a test submission **for the specific form that's failing** (`variant: "hero"` or
   `variant: "band"`, they go to different JotForm forms) and read the JSON. `reason:"captcha"`
   means JotForm's spam gate fired: check `simple_spc` first.
3. Re-read that form's field names from its live page, JotForm renames inputs when a field is
   deleted and re-added:
   ```bash
   curl -s https://form.jotform.com/262671761366060 | grep -o 'name="q[0-9]*_[^"]*"'  # hero
   curl -s https://form.jotform.com/262702126696056 | grep -o 'name="q[0-9]*_[^"]*"'  # band
   ```
