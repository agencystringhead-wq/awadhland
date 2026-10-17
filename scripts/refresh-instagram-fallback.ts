/**
 * npm run instagram:refresh
 *
 * Downloads the latest 8 posts from @awadhland into /public/images/instagram as WebP and rewrites
 * data/instagram-fallback.json, so the build-time copy of the Instagram section matches the account.
 * Run it occasionally (the live feed does not depend on it; this is only what shows before the live
 * posts load and whenever the feed is unavailable), then commit the changed files.
 *
 * The token comes from the IG_ACCESS_TOKEN environment variable or a line `IG_ACCESS_TOKEN=...` in
 * .env.local (gitignored). It is never written anywhere by this script.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const imageDir = path.join(root, "public", "images", "instagram");
const jsonFile = path.join(root, "data", "instagram-fallback.json");
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const SIZE = 640;

function token(): string {
  if (process.env.IG_ACCESS_TOKEN) return process.env.IG_ACCESS_TOKEN.trim();
  const envFile = path.join(root, ".env.local");
  if (fs.existsSync(envFile)) {
    const m = /^IG_ACCESS_TOKEN\s*=\s*(.+)$/m.exec(fs.readFileSync(envFile, "utf8"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  console.error("IG_ACCESS_TOKEN is not set. Put it in .env.local (gitignored) or the environment, then run again.");
  process.exit(1);
}

const trim = (caption: unknown) => {
  const text = typeof caption === "string" ? caption.replace(/\s+/g, " ").trim() : "";
  if (text.length <= 120) return text;
  const cut = text.slice(0, 120);
  const at = cut.lastIndexOf(" ");
  return `${(at > 60 ? cut.slice(0, at) : cut).replace(/[\s,.;:!-]+$/, "")}…`;
};

async function main() {
  const res = await fetch(`https://graph.instagram.com/me/media?fields=${FIELDS}&limit=8&access_token=${encodeURIComponent(token())}`);
  if (!res.ok) {
    // The Instagram error body never contains the token; print only its message.
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    console.error(`Instagram API ${res.status}: ${body?.error?.message ?? "no message"}`);
    process.exit(1);
  }
  const { data } = (await res.json()) as { data?: Record<string, unknown>[] };
  const media = (data ?? []).filter((m) => ["IMAGE", "VIDEO", "CAROUSEL_ALBUM"].includes(String(m.media_type)));
  if (media.length === 0) {
    console.error("The account returned no posts; leaving the fallback untouched.");
    process.exit(1);
  }

  fs.mkdirSync(imageDir, { recursive: true });
  for (const f of fs.readdirSync(imageDir)) if (/^post-\d+\./.test(f)) fs.rmSync(path.join(imageDir, f));

  const posts = [];
  for (const [i, m] of media.slice(0, 8).entries()) {
    const src = String(m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url);
    const img = await fetch(src);
    if (!img.ok) throw new Error(`post ${i + 1}: image download failed (${img.status})`);
    const file = `post-${i + 1}.webp`;
    await sharp(Buffer.from(await img.arrayBuffer()))
      .resize(SIZE, SIZE, { fit: "cover" })
      .webp({ quality: 82 })
      .toFile(path.join(imageDir, file));
    posts.push({
      image: `/images/instagram/${file}`,
      caption: trim(m.caption),
      permalink: String(m.permalink),
      timestamp: new Date(String(m.timestamp)).toISOString(),
      media_type: m.media_type,
    });
    console.log(`ok   ${file}  ${String(m.permalink)}`);
  }
  fs.writeFileSync(jsonFile, `${JSON.stringify(posts, null, 2)}\n`);
  console.log(`wrote data/instagram-fallback.json (${posts.length} posts). Commit it with public/images/instagram/.`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
