import { faqPage } from "@/lib/jsonld";
import { JsonLd } from "./JsonLd";

export type FAQItem = { q: string; a: string };

export type FAQProps = {
  title?: string;
  items: FAQItem[];
};

/** Visible Q&As and FAQPage JSON-LD from the same array (spec "Shared components"). */
export function FAQ({ title, items }: FAQProps) {
  if (items.length === 0) return null;
  return (
    <section data-component="FAQ">
      <JsonLd data={faqPage(items)} />
      {title && <h2>{title}</h2>}
      <dl className="mt-4 divide-y divide-line card px-5">
        {items.map((item) => (
          <div key={item.q} className="py-4">
            <dt className="font-semibold">{item.q}</dt>
            <dd className="mt-1 text-ink-soft">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
