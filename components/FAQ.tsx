export type FAQItem = { q: string; a: string };

export type FAQProps = {
  items: FAQItem[];
};

/** Stub. Visible Q&As; FAQPage JSON-LD from the same array is added in step 6. */
export function FAQ({ items }: FAQProps) {
  if (items.length === 0) return null;
  return (
    <section data-component="FAQ">
      <dl>
        {items.map((item) => (
          <div key={item.q}>
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
