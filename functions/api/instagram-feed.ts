/**
 * Live Instagram feed for the scroller above the footer.
 *
 * Cloudflare Pages Function at /api/instagram-feed, same origin as the site. Calls the Instagram API
 * with Instagram Login (graph.instagram.com/me/media), returns the newest 8 posts as clean JSON and
 * keeps the response in the Cloudflare Cache API for 1 hour, so Instagram is called about once an
 * hour, not once per page view. Browsers are told to keep it for only 5 minutes, so a new post
 * shows within the hour.
 *
 * The long-lived access token lives only in a KV namespace bound to this project as IG_KV:
 *   IG_ACCESS_TOKEN   the token itself
 *   IG_TOKEN_ISSUED   YYYY-MM-DD it was issued or last refreshed (if absent, the token is refreshed
 *                     on first use and the date is written back)
 * It is never in the repo and never in a response. A token older than 50 days is refreshed
 * (graph.instagram.com/refresh_access_token) and saved back; Instagram's tokens last 60 days.
 *
 * Any failure (no KV binding, no token, Instagram error, empty feed) answers 200 with
 * {source: "fallback"} and the build-time posts from data/instagram-fallback.json. The browser keeps
 * what it already rendered in that case, so the section is never empty and never an error.
 */
import fallbackJson from "../../data/instagram-fallback.json";

type KV = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};
type Env = { IG_KV?: KV };
type Ctx = { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void };

type Post = {
  image: string;
  caption: string;
  permalink: string;
  timestamp: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};

const API = "https://graph.instagram.com";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const COUNT = 8;
const CAPTION_MAX = 120;
const CACHE_SECONDS = 60 * 60;
const BROWSER_SECONDS = 5 * 60;
const REFRESH_AFTER_DAYS = 50;
const TOKEN_KEY = "IG_ACCESS_TOKEN";
const ISSUED_KEY = "IG_TOKEN_ISSUED";

const respond = (body: unknown, cacheSeconds: number, source: "live" | "fallback") =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${cacheSeconds}`,
      "X-Feed-Source": source,
    },
  });

/** Copy of a response whose Cache-Control is the short browser lifetime (the edge copy keeps CACHE_SECONDS). */
function forBrowser(res: Response): Response {
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", `public, max-age=${BROWSER_SECONDS}`);
  return out;
}

/** Build-time posts, shaped like live ones (the `placeholder` flag is not part of the response). */
function fallbackResponse(): Response {
  const posts = (fallbackJson as (Post & { placeholder?: boolean })[]).map(({ image, caption, permalink, timestamp, media_type }) => ({
    image,
    caption,
    permalink,
    timestamp,
    media_type,
  }));
  // Short cache: once the token is added, the live feed should appear within minutes.
  return respond({ source: "fallback", posts }, 300, "fallback");
}

/** Caption cut at a word boundary near 120 characters. */
function trimCaption(caption: unknown): string {
  const text = typeof caption === "string" ? caption.replace(/\s+/g, " ").trim() : "";
  if (text.length <= CAPTION_MAX) return text;
  const cut = text.slice(0, CAPTION_MAX);
  const at = cut.lastIndexOf(" ");
  return `${(at > 60 ? cut.slice(0, at) : cut).replace(/[\s,.;:!-]+$/, "")}…`;
}

async function getJson(url: string): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 5000);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const daysSince = (isoDate: string) => (Date.now() - Date.parse(`${isoDate}T00:00:00Z`)) / 86_400_000;
const today = () => new Date().toISOString().slice(0, 10);

/** The token to use, refreshed first when it is old (or its issue date is unknown). */
async function currentToken(kv: KV): Promise<string | null> {
  const token = (await kv.get(TOKEN_KEY))?.trim();
  if (!token) return null;
  const issued = (await kv.get(ISSUED_KEY))?.trim();
  if (issued && /^\d{4}-\d{2}-\d{2}$/.test(issued) && daysSince(issued) <= REFRESH_AFTER_DAYS) return token;

  const refreshed = (await getJson(`${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`)) as {
    access_token?: string;
  } | null;
  if (refreshed?.access_token) {
    await kv.put(TOKEN_KEY, refreshed.access_token);
    await kv.put(ISSUED_KEY, today());
    return refreshed.access_token;
  }
  // Refresh failed (for example the token is under 24 hours old): keep using the one we have.
  return token;
}

export async function onRequestGet({ request, env, waitUntil }: Ctx): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(new URL("/api/instagram-feed", request.url).toString(), { method: "GET" });
  const hit = await cache.match(cacheKey);
  if (hit) return forBrowser(hit);

  try {
    if (!env.IG_KV) return fallbackResponse();
    const token = await currentToken(env.IG_KV);
    if (!token) return fallbackResponse();

    const data = (await getJson(`${API}/me/media?fields=${FIELDS}&limit=${COUNT}&access_token=${encodeURIComponent(token)}`)) as {
      data?: Record<string, unknown>[];
    } | null;
    const posts: Post[] = (data?.data ?? []).flatMap((m) => {
      const type = m.media_type;
      if (type !== "IMAGE" && type !== "VIDEO" && type !== "CAROUSEL_ALBUM") return [];
      // Videos have no still in media_url; they use thumbnail_url. Images and carousels use media_url.
      const image = type === "VIDEO" ? m.thumbnail_url : m.media_url;
      if (typeof image !== "string" || typeof m.permalink !== "string" || typeof m.timestamp !== "string") return [];
      return [{ image, caption: trimCaption(m.caption), permalink: m.permalink, timestamp: m.timestamp, media_type: type }];
    });
    if (posts.length === 0) return fallbackResponse();

    const live = respond({ source: "live", posts: posts.slice(0, COUNT) }, CACHE_SECONDS, "live");
    waitUntil(cache.put(cacheKey, live.clone()));
    return forBrowser(live);
  } catch {
    return fallbackResponse();
  }
}
