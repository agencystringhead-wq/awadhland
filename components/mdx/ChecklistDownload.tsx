import { whatsappHref } from "@/components/WhatsAppButton";
import { CHECKLIST_PDFS } from "@/lib/checklist";
import { getBroker } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

const copy = {
  en: {
    download: "Download free PDF",
    print: "Open to print",
    meta: "3 pages · A4 · no sign-up",
    preview: "Page 1 of the Land Safety Checklist PDF",
    ask: "Want us to check a plot for you? WhatsApp us the khasra number.",
    askCta: "WhatsApp us the khasra number",
    askText: "Hi, please check a plot for me. Khasra number: ___ Village: ___",
  },
  hi: {
    download: "मुफ़्त पीडीएफ़ डाउनलोड करें",
    print: "प्रिंट के लिए खोलें",
    meta: "3 पन्ने · A4 · कोई साइन-अप नहीं",
    preview: "ज़मीन सुरक्षा चेकलिस्ट पीडीएफ़ का पहला पन्ना",
    ask: "चाहते हैं कि हम आपके लिए प्लॉट जाँचें? खसरा नंबर व्हाट्सऐप करें।",
    askCta: "खसरा नंबर व्हाट्सऐप करें",
    askText: "नमस्ते, कृपया मेरे लिए एक प्लॉट जाँचें। खसरा नंबर: ___ गाँव: ___",
  },
} as const;

/**
 * Guide MDX component: the free download at the top of the checklist page. The page-1 preview and
 * the big button download this language's PDF directly, no email gate; "Open to print" opens it in
 * a tab for the browser's print dialog. The WhatsApp offer sits under it. Downloads are counted by
 * the site-wide click listener (components/LeadAnalytics) as checklist_download.
 *
 * The PDFs are generated from the page's own lists (scripts/build-checklist-pdf.ts), so they say
 * exactly what the page says.
 */
export function ChecklistDownload({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const pdf = CHECKLIST_PDFS[locale];
  const broker = getBroker();
  return (
    <section data-component="ChecklistDownload" className="card mdx-block not-prose my-8 grid gap-6 p-5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center md:p-6">
      <a href={pdf.href} download className="block overflow-hidden rounded-lg border border-line shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, plain img with explicit size */}
        <img src={pdf.preview.src} width={pdf.preview.width} height={pdf.preview.height} alt={c.preview} className="h-auto w-full" />
      </a>
      <div>
        <a href={pdf.href} download className="btn btn-primary w-full px-7 py-4 text-[17px] sm:w-auto">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {c.download}
        </a>
        <p className="mt-2 text-sm text-muted">
          {c.meta} ·{" "}
          <a href={pdf.href} target="_blank" rel="noopener">
            {c.print}
          </a>
        </p>
        <p className="mt-5 border-t border-line pt-4 text-ink-soft">{c.ask}</p>
        <a href={whatsappHref(broker.whatsapp, c.askText)} rel="noopener" className="btn mt-3 bg-whatsapp px-5 py-3 text-[15px] text-white hover:bg-accent-deep hover:text-white">
          {c.askCta}
        </a>
      </div>
    </section>
  );
}
