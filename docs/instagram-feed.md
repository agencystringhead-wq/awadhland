# Instagram feed and social links

## What ships

- `lib/social.ts`: the four profile URLs (Facebook, Instagram, X, YouTube) and the labels, in one place. The footer icons, the Organization `sameAs` array and the Instagram section all read it.
- Footer: a "Follow us" group of four 44 px icon links (new tab, `rel="noopener noreferrer"`, aria-label per language).
- `components/InstagramScroller.tsx`: site-wide section above the footer (rendered inside `PageShell`). The build paints the posts in `data/instagram-fallback.json`; when the section is within 400 px of the viewport the browser calls `/api/instagram-feed` once and swaps in the live posts. Tiles are fixed-ratio squares, so nothing moves on the swap.
- `functions/api/instagram-feed.ts`: Pages Function. Calls `graph.instagram.com/me/media`, returns the newest 8 posts, caches the answer in the Cloudflare Cache API for 1 hour (browsers keep it for 5 minutes). Any failure returns `{source: "fallback"}` and the browser keeps what it has.
- `scripts/refresh-instagram-fallback.ts` (`npm run instagram:refresh`): downloads the latest 8 posts as WebP into `public/images/instagram/` and rewrites the fallback JSON.

## Deviations from the rest of the spec

- This is the one place a page fetches at runtime (CLAUDE.md "no runtime fetching"). It is a same-origin call to our own Function, fired once, and the page is complete without it.
- Live tile images are Instagram CDN URLs (`<img>`, no script, `referrerpolicy="no-referrer"`), not WebP on R2. Only the committed fallback images follow the WebP rule.

## Token handling

The token is stored in a Workers KV namespace bound to the Pages project as `IG_KV`:

| Key | Value |
| --- | --- |
| `IG_ACCESS_TOKEN` | the long-lived Instagram token |
| `IG_TOKEN_ISSUED` | `YYYY-MM-DD` the token was issued or last refreshed |

The Function refreshes a token older than 50 days and writes the new token and date back. If `IG_TOKEN_ISSUED` is missing it refreshes on first use. The token is never in the repo, never in a response and never logged.

## Setup, step by step

1. **Create the namespace.** Cloudflare dashboard → Storage & Databases → Workers KV → Create a namespace, name it `awadhland-instagram`.
2. **Bind it.** Workers & Pages → `awadhland` → Settings → Bindings → Add → KV namespace. Variable name `IG_KV`, namespace `awadhland-instagram`. Add it for both Production and Preview. Save, then redeploy (a binding applies to the next deployment).
3. **Add the token.** Workers KV → `awadhland-instagram` → KV Pairs → Add entry: key `IG_ACCESS_TOKEN`, value the token. Add a second entry: key `IG_TOKEN_ISSUED`, value today's date as `YYYY-MM-DD`. Do this in the dashboard, not in chat or git.
4. **Check it.** Open `https://awadhland.com/api/instagram-feed`. A working feed shows `"source":"live"` and 8 posts; `"source":"fallback"` means the token or binding is missing or Instagram refused it. The `X-Feed-Source` response header says the same. A live answer is cached at Cloudflare for 1 hour and in browsers for 5 minutes; a fallback answer for 5 minutes.

   **Show a new post immediately.** Otherwise a new post appears within the hour. To skip the wait, purge the cached feed: Cloudflare → Caching → Purge Cache → Custom Purge → URL `https://awadhland.com/api/instagram-feed`. The next request fetches from Instagram, and browsers pick it up within 5 minutes.
5. **Refresh the fallback copy** (optional, occasionally): put `IG_ACCESS_TOKEN=...` in `.env.local` (gitignored), run `npm run instagram:refresh`, commit `data/instagram-fallback.json` and `public/images/instagram/`.

The Function does not run under `next dev`; test with `npx wrangler pages dev out` after a build, or on a Pages preview.
