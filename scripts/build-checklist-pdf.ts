/**
 * npm run checklist:pdf
 *
 * Generates the printable land safety checklist, one PDF per language, from lib/checklist.ts, plus
 * a page-1 preview image for each, and records what they were built from in
 * scripts/checklist-pdf.lock.json. Run it after any change to the checklist and commit the output;
 * scripts/validate.ts fails the build when the lock no longer matches the lists.
 *
 * Needs a local Chrome or Edge (it drives one headless over the DevTools protocol; set CHROME_PATH
 * if it is not in the usual place), so it is a commit-time step, not part of the Pages build.
 *
 * What the PDF says is only what the page says, plus the site address and the broker's WhatsApp
 * number from data/team.json. It makes no claim about registration: the hand-designed PDF it
 * replaces named a UP RERA registration that is not yet on record.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import {
  CHECKLIST_COUNT,
  CHECKLIST_DOCUMENTS,
  CHECKLIST_PDF_LOCK,
  CHECKLIST_PDFS,
  CHECKLIST_RED_FLAGS,
  CHECKLIST_STAGES,
  checklistContentHash,
} from "../lib/checklist";
import { getBroker } from "../lib/data";
import type { Locale } from "../lib/i18n";

const ROOT = process.cwd();
const VERSION = { en: "September 2026", hi: "सितंबर 2026" } as const;

const font = (pkg: string, file: string) => pathToFileURL(path.join(ROOT, "node_modules", pkg, "files", file)).href;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const copy = {
  en: {
    eyebrow: "AWADHLAND.COM",
    title: "Land Safety Checklist<br>Uttar Pradesh",
    sub: `${CHECKLIST_COUNT} checks before you pay token money for land or a plot in Ayodhya, Lucknow or Gorakhpur`,
    howTitle: "How to use:",
    how: "tick each box only after you have seen the document yourself, not after someone tells you it's fine.",
    keepTitle: "Keep it with you:",
    keep: "print this or save it on your phone and go through it at every site visit and meeting with the seller.",
    ruleTitle: "Rule of thumb:",
    rule: "one unticked box in section 1 or 2 means don't pay the token yet.",
    redFlags: "Red flags: walk away or slow down",
    documents: "Documents to collect",
    documentsHint: "tick as you receive them",
    helpTitle: "Want us to check a plot for you?",
    help: (wa: string) => `WhatsApp the khasra number and village to ${wa}, or go to awadhland.com. Free circle-rate lookup, stamp duty calculator and plot yield calculator are on the site.`,
    disclaimer: `This checklist is general information for buyers in Uttar Pradesh, not legal or tax advice. Rules and portals change; always have an advocate verify the title and a CA confirm tax before you pay. Version: ${VERSION.en}.`,
    lookup: "awadhland.com/tools/circle-rate-lookup",
  },
  hi: {
    eyebrow: "AWADHLAND.COM",
    title: "ज़मीन की सुरक्षा चेकलिस्ट<br>उत्तर प्रदेश",
    sub: `अयोध्या, लखनऊ या गोरखपुर में ज़मीन या प्लॉट का टोकन देने से पहले ${CHECKLIST_COUNT} जाँचें`,
    howTitle: "कैसे इस्तेमाल करें:",
    how: "बॉक्स पर निशान तभी लगाएँ जब दस्तावेज़ आपने ख़ुद देख लिया हो, किसी के कहने पर नहीं।",
    keepTitle: "साथ रखें:",
    keep: "इसे प्रिंट करें या फ़ोन में रखें, और हर बार मौक़े पर जाते समय और बेचने वाले से मिलते समय देखें।",
    ruleTitle: "मोटा नियम:",
    rule: "चरण 1 या 2 में एक भी ख़ाली बॉक्स हो तो अभी टोकन न दें।",
    redFlags: "ख़तरे के संकेत: रुकें या पीछे हटें",
    documents: "जुटाने वाले दस्तावेज़",
    documentsHint: "मिलते ही निशान लगाएँ",
    helpTitle: "चाहते हैं कि हम आपके लिए प्लॉट जाँचें?",
    help: (wa: string) => `खसरा नंबर और गाँव ${wa} पर व्हाट्सऐप करें, या awadhland.com पर जाएँ। मुफ़्त सर्किल रेट खोज, स्टाम्प ड्यूटी कैलकुलेटर और प्लॉट रिटर्न कैलकुलेटर साइट पर हैं।`,
    disclaimer: `यह चेकलिस्ट उत्तर प्रदेश के ख़रीदारों के लिए सामान्य जानकारी है, क़ानूनी या टैक्स सलाह नहीं। नियम और पोर्टल बदलते रहते हैं; भुगतान से पहले स्वामित्व की जाँच वकील से और टैक्स की पुष्टि सीए से कराएँ। संस्करण: ${VERSION.hi}।`,
    lookup: "awadhland.com/tools/circle-rate-lookup",
  },
} as const;

function html(locale: Locale): string {
  const c = copy[locale];
  const hi = locale === "hi";
  const wa = getBroker().whatsapp.replace(/^91(\d{5})(\d{5})$/, "+91 $1 $2");
  const body = hi ? "'Noto Sans Devanagari', 'Inter', sans-serif" : "'Inter', 'Noto Sans Devanagari', sans-serif";
  const display = hi ? "'Noto Sans Devanagari', sans-serif" : "'Fraunces', 'Noto Sans Devanagari', serif";

  const stages = CHECKLIST_STAGES.map(
    (s) => `
    <section class="stage">
      <h2><span>${s.n}. ${esc(s.title[locale])}</span><small>${esc(s.hint[locale])}</small></h2>
      <ol>
        ${s.items
          .map(
            (it) => `
        <li>
          <span class="box"></span><span class="num">${it.n}</span>
          <div>
            <p><strong>${esc(it.lead[locale])}</strong> ${esc(it.text[locale])}${
              it.links?.length
                ? ` <span class="link">${it.links.map((l) => (l.href.startsWith("/") ? c.lookup : esc(l.label))).join(" · ")}</span>`
                : ""
            }</p>
            ${it.note ? `<p class="note">${esc(it.note[locale])}</p>` : ""}
          </div>
        </li>`,
          )
          .join("")}
      </ol>
    </section>`,
  ).join("");

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<style>
@font-face { font-family: 'Inter'; src: url('${font("@fontsource-variable/inter", "inter-latin-wght-normal.woff2")}') format('woff2'); font-weight: 100 900; }
@font-face { font-family: 'Fraunces'; src: url('${font("@fontsource-variable/fraunces", "fraunces-latin-wght-normal.woff2")}') format('woff2'); font-weight: 100 900; }
@font-face { font-family: 'Noto Sans Devanagari'; src: url('${font("@fontsource-variable/noto-sans-devanagari", "noto-sans-devanagari-devanagari-wght-normal.woff2")}') format('woff2'); font-weight: 100 900; unicode-range: U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF; }
@font-face { font-family: 'Noto Sans Devanagari'; src: url('${font("@fontsource-variable/noto-sans-devanagari", "noto-sans-devanagari-latin-wght-normal.woff2")}') format('woff2'); font-weight: 100 900; unicode-range: U+0000-00FF, U+2000-206F; }
@page { size: A4; margin: 12mm 14mm 11mm; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { padding: 0; font-family: ${body}; font-size: ${hi ? "10pt" : "9.4pt"}; line-height: ${hi ? 1.55 : 1.45}; color: #1f1a14; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
header { border-radius: 10px; padding: 16px 20px 15px; color: #fff; background: linear-gradient(100deg, #b8521f 0%, #c45f2a 45%, #e88a4f 100%); }
header .eyebrow { font-family: 'Inter', sans-serif; font-size: 8pt; font-weight: 700; letter-spacing: 0.16em; opacity: 0.92; }
header h1 { margin: 5px 0 5px; font-family: ${display}; font-weight: ${hi ? 700 : 560}; font-size: ${hi ? "21pt" : "23pt"}; line-height: 1.12; }
header p { margin: 0; font-size: 10pt; opacity: 0.95; }
.tips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0 4px; }
.tips div { border-radius: 8px; background: #fbf1e6; padding: 8px 10px; font-size: ${hi ? "9pt" : "8.5pt"}; line-height: 1.4; }
.tips b { color: #a04a1f; }
.stage { break-inside: auto; }
h2 { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 13px 0 2px; padding-bottom: 4px; border-bottom: 2px solid #c45f2a; font-family: ${display}; font-weight: ${hi ? 700 : 600}; font-size: 13pt; break-after: avoid; }
h2 small { font-family: ${body}; font-weight: 400; font-size: 8.5pt; color: #6b6053; }
ol { list-style: none; margin: 0; padding: 0; }
.stage li { display: grid; grid-template-columns: 13px 22px 1fr; gap: 6px; padding: 6px 0; border-bottom: 1px solid #e6dac2; break-inside: avoid; }
.box { width: 11px; height: 11px; margin-top: 3px; border: 1.3px solid #3b342a; border-radius: 2px; }
.num { font-weight: 700; color: #c45f2a; text-align: right; }
li p { margin: 0; }
.note { margin-top: 1px !important; font-size: ${hi ? "8.8pt" : "8.3pt"}; color: #5a5046; }
.link { font-size: 8pt; color: #a04a1f; white-space: nowrap; }
.flags { margin-top: 14px; border: 1.3px solid #c0392b; border-radius: 8px; background: #fdf1ef; padding: 9px 14px 8px; break-inside: avoid; }
.flags h3 { margin: 0 0 4px; color: #a8261a; font-family: ${display}; font-weight: 700; font-size: 11.5pt; }
.flags ul { margin: 0; padding-left: 16px; }
.flags li { padding: 1px 0; }
.docs { margin-top: 4px; columns: 2; column-gap: 20px; list-style: none; padding: 0; }
.docs li { display: block; border: 0; padding: 2px 0; }
.docs li::before { content: "☐  "; }
.help { margin-top: 12px; border-radius: 8px; background: #fbf1e6; padding: 9px 12px; font-size: ${hi ? "9pt" : "8.6pt"}; break-inside: avoid; }
.help b { color: #a04a1f; }
.disclaimer { margin-top: 8px; font-size: ${hi ? "8pt" : "7.6pt"}; color: #6b6053; }
</style>
</head>
<body>
<header>
  <div class="eyebrow">${c.eyebrow}</div>
  <h1>${c.title}</h1>
  <p>${esc(c.sub)}</p>
</header>
<div class="tips">
  <div><b>${c.howTitle}</b> ${esc(c.how)}</div>
  <div><b>${c.keepTitle}</b> ${esc(c.keep)}</div>
  <div><b>${c.ruleTitle}</b> ${esc(c.rule)}</div>
</div>
${stages}
<div class="flags">
  <h3>${esc(c.redFlags)}</h3>
  <ul>${CHECKLIST_RED_FLAGS.map((f) => `<li>${esc(f[locale])}</li>`).join("")}</ul>
</div>
<h2><span>${esc(c.documents)}</span><small>${esc(c.documentsHint)}</small></h2>
<ul class="docs">${CHECKLIST_DOCUMENTS.map((d) => `<li>${esc(d[locale])}</li>`).join("")}</ul>
<div class="help"><b>${esc(c.helpTitle)}</b> ${esc(c.help(wa))}</div>
<p class="disclaimer">${esc(c.disclaimer)}</p>
</body>
</html>`;
}

/* ------------------------------------------------------------------ chrome */

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];
  const hit = candidates.find((p) => fs.existsSync(p));
  if (!hit) throw new Error("No Chrome or Edge found; set CHROME_PATH");
  return hit;
}

type Send = (method: string, params?: object) => Promise<{ result?: Record<string, unknown>; error?: unknown }>;

async function withChrome<T>(fn: (send: Send) => Promise<T>): Promise<T> {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "awadhland-chrome-"));
  const port = 9300 + Math.floor(Math.random() * 500);
  const chrome = spawn(findChrome(), ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"]);
  try {
    let targets: { type: string; webSocketDebuggerUrl: string }[] = [];
    for (let i = 0; i < 60 && targets.length === 0; i++) {
      try {
        targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("Chrome did not open a page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r));
    let id = 0;
    const pending = new Map<number, (m: { result?: Record<string, unknown>; error?: unknown }) => void>();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(String(e.data));
      if (m.id && pending.has(m.id)) pending.get(m.id)!(m);
    });
    const send: Send = (method, params = {}) =>
      new Promise((r) => {
        const i = ++id;
        pending.set(i, r);
        ws.send(JSON.stringify({ id: i, method, params }));
      });
    const out = await fn(send);
    ws.close();
    return out;
  } finally {
    chrome.kill();
    await new Promise((r) => setTimeout(r, 300));
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

/* -------------------------------------------------------------------- main */

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "awadhland-checklist-"));
  const report: string[] = [];
  const pages: Record<string, number> = {};

  await withChrome(async (send) => {
    for (const locale of ["en", "hi"] as const) {
      const file = path.join(tmp, `checklist-${locale}.html`);
      fs.writeFileSync(file, html(locale));
      await send("Page.enable");
      await send("Page.navigate", { url: pathToFileURL(file).href });
      // Wait for layout and every web font, or Chrome prints the fallback faces.
      for (let i = 0; i < 80; i++) {
        const r = await send("Runtime.evaluate", { expression: "document.readyState === 'complete' && document.fonts.status === 'loaded'", returnByValue: true });
        if ((r.result?.result as { value?: boolean })?.value) break;
        await new Promise((res) => setTimeout(res, 150));
      }

      /* the PDF */
      const pdf = await send("Page.printToPDF", { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
      const data = Buffer.from(String(pdf.result?.data), "base64");
      const target = CHECKLIST_PDFS[locale];
      fs.mkdirSync(path.dirname(path.join(ROOT, target.file)), { recursive: true });
      fs.writeFileSync(path.join(ROOT, target.file), data);
      pages[locale] = (data.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

      /* page-1 preview: the print layout at A4, top page only */
      await send("Emulation.setEmulatedMedia", { media: "print" });
      // A4 at 96 dpi less the page margins, so the screenshot wraps the way the printed page does,
      // then padded back out to the page size for the preview.
      await send("Emulation.setDeviceMetricsOverride", { width: 688, height: 1500, deviceScaleFactor: 2, mobile: false });
      const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 688, height: 1036, scale: 1 } });
      await send("Emulation.clearDeviceMetricsOverride");
      await send("Emulation.setEmulatedMedia", { media: "" });
      const png = Buffer.from(String(shot.result?.data), "base64");
      const { width, height } = target.preview;
      // Pad by the page margins (12/14 mm = 45/53 px at 96 dpi, doubled for the 2x capture) so the
      // preview looks like the page, then fit the 60-115 KB budget, from q90 down.
      const page1 = await sharp(png).extend({ top: 90, bottom: 84, left: 106, right: 106, background: "#ffffff" }).flatten({ background: "#ffffff" }).toBuffer();
      let webp = Buffer.alloc(0);
      for (const q of [90, 88, 86, 84, 82]) {
        webp = await sharp(page1).resize({ width, height, fit: "cover", position: "top" }).webp({ quality: q }).toBuffer();
        if (webp.length <= 115 * 1024) break;
      }
      const prev = path.join(ROOT, "public", target.preview.src);
      fs.mkdirSync(path.dirname(prev), { recursive: true });
      fs.writeFileSync(prev, webp);

      report.push(`${locale}: ${target.file} ${(data.length / 1024).toFixed(0)} KB, ${pages[locale]} pages; preview ${(webp.length / 1024).toFixed(0)} KB`);
    }
  });

  fs.writeFileSync(
    path.join(ROOT, CHECKLIST_PDF_LOCK),
    JSON.stringify({ contentHash: checklistContentHash(), pages, generatedAt: new Date().toISOString().slice(0, 10) }, null, 2) + "\n",
  );
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`ok   checklist:pdf\n     ${report.join("\n     ")}`);
}

void main().catch((e) => {
  console.error(`FAIL checklist:pdf: ${(e as Error).stack ?? e}`);
  process.exit(1);
});
