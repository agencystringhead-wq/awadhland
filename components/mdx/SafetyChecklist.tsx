import { JsonLd } from "@/components/JsonLd";
import { CHECKLIST_COUNT, CHECKLIST_DOCUMENTS, CHECKLIST_RED_FLAGS, CHECKLIST_STAGES } from "@/lib/checklist";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * Guide MDX component: one stage of the land safety checklist, or its red flags or documents,
 * rendered from lib/checklist.ts so the page and its ItemList schema read one source.
 *
 *   <SafetyChecklist stage="1" />   the checks of stage 1, numbered as in the PDF
 *   <SafetyChecklist part="redFlags" />
 *   <SafetyChecklist part="documents" />
 *
 * The stage headings are written in the MDX as ## headings, so the table of contents picks them up.
 */
/** `stage` arrives as a string from MDX (stage="1"), which is what scripts/validate.ts can check. */
export function SafetyChecklist({ locale, stage, part }: { locale: Locale; stage?: number | string; part?: "redFlags" | "documents" }) {
  if (part === "redFlags") {
    return (
      <ul data-component="SafetyChecklist" className="card mdx-block my-6 list-disc space-y-2 border-maroon/40 bg-maroon-soft/40 py-5 pl-9 pr-5">
        {CHECKLIST_RED_FLAGS.map((f) => (
          <li key={f.en}>{f[locale]}</li>
        ))}
      </ul>
    );
  }
  if (part === "documents") {
    return (
      <ul data-component="SafetyChecklist" className="my-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {CHECKLIST_DOCUMENTS.map((d) => (
          <li key={d.en} className="flex gap-2.5">
            <span aria-hidden="true" className="mt-1 inline-block size-4 shrink-0 rounded-[3px] border border-ink-soft" />
            <span>{d[locale]}</span>
          </li>
        ))}
      </ul>
    );
  }
  const s = CHECKLIST_STAGES.find((x) => x.n === Number(stage));
  if (!s) return null;
  return (
    <div data-component="SafetyChecklist" className="my-6">
      <p className="caption-mono -mt-2 mb-4 text-muted">{s.hint[locale]}</p>
      <ol className="divide-y divide-line border-y border-line" start={s.items[0].n}>
        {s.items.map((it) => (
          <li key={it.n} id={`check-${it.n}`} className="flex gap-4 py-4">
            <span aria-hidden="true" className="w-7 shrink-0 pt-0.5 text-right font-semibold tabular-nums text-accent-deep">
              {it.n}
            </span>
            <div>
              <p>
                <strong>{it.lead[locale]}</strong> {it.text[locale]}
                {it.links?.map((l) => (
                  <a
                    key={l.href}
                    href={l.href.startsWith("/") ? localePath(locale, l.href) : l.href}
                    rel={l.href.startsWith("/") ? undefined : "noopener"}
                    className="ml-2 whitespace-nowrap text-sm"
                  >
                    {l.href.startsWith("/") ? (locale === "hi" ? "सर्किल रेट खोजें" : "Circle rate lookup") : l.label}
                  </a>
                ))}
              </p>
              {it.note && <p className="mt-1 text-sm text-ink-soft">{it.note[locale]}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** ItemList JSON-LD for all 30 checks, in order. Placed once per page. */
export function ChecklistSchema({ locale, name }: { locale: Locale; name: string }) {
  const items = CHECKLIST_STAGES.flatMap((s) => s.items);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        numberOfItems: CHECKLIST_COUNT,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: items.map((it) => ({
          "@type": "ListItem",
          position: it.n,
          name: `${it.lead[locale].replace(/:$/, "")}`,
          description: `${it.lead[locale]} ${it.text[locale]}`.trim(),
        })),
      }}
    />
  );
}
