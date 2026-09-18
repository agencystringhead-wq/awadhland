/**
 * npm run images:cities
 *
 * Gradient placeholders for the city hero images in the mega menu and city cards, 1200 × 800 WebP,
 * until real on-site photos arrive on R2. Skips files that already exist so a real photo dropped
 * in place is never overwritten.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const cities: { id: string; name: string; from: string; to: string }[] = [
  { id: "ayodhya", name: "Ayodhya", from: "#e3d7bb", to: "#c45f2a" },
  { id: "lucknow", name: "Lucknow", from: "#efe7d7", to: "#8f3d1a" },
  { id: "gorakhpur", name: "Gorakhpur", from: "#e6dac2", to: "#a04a1f" },
];

async function main() {
  const dir = path.join(process.cwd(), "public", "images", "cities");
  fs.mkdirSync(dir, { recursive: true });
  for (const c of cities) {
    const file = path.join(dir, `${c.id}.webp`);
    if (fs.existsSync(file)) {
      console.log(`skip ${c.id}.webp exists`);
      continue;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.from}"/><stop offset="1" stop-color="${c.to}"/></linearGradient></defs>
      <rect width="1200" height="800" fill="url(#g)"/>
      <text x="60" y="720" font-family="Georgia, serif" font-size="96" fill="rgba(255,247,239,0.92)">${c.name}</text>
      <text x="62" y="770" font-family="monospace" font-size="22" letter-spacing="4" fill="rgba(255,247,239,0.7)">PLACEHOLDER · REAL PHOTO TO FOLLOW</text>
    </svg>`;
    const info = await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(file);
    console.log(`ok   ${c.id}.webp ${info.width}x${info.height} ${Math.round(info.size / 1024)}k`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
