export type FAQItem = { q: string; a: string };

export type FAQProps = {
  title?: string;
  items: FAQItem[];
};

/** Visible Q&As; FAQPage JSON-LD from the same array is added in step 6. */
export function FAQ({ title, items }: FAQProps) {
  if (items.length === 0) return null;
  return (
    <section data-component="FAQ">
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
