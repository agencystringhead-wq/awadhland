export type KeyFact = {
  label: string;
  value: string;
  sourceUrl?: string;
};

export type KeyFactsProps = {
  facts: KeyFact[];
};

/** Definition list with source footnotes. Empty values are omitted by the caller (spec Template 3 rules). */
export function KeyFacts({ facts }: KeyFactsProps) {
  if (facts.length === 0) return null;
  return (
    <dl data-component="KeyFacts" className="card divide-y divide-line px-5">
      {facts.map((f) => (
        <div key={f.label} className="grid gap-1 py-3 md:grid-cols-[14rem_1fr] md:gap-4">
          <dt className="text-sm text-muted md:pt-0.5">{f.label}</dt>
          <dd className="font-medium">
            {f.value}
            {f.sourceUrl && (
              <>
                {" "}
                <a href={f.sourceUrl} rel="noopener" className="text-sm font-normal text-muted">
                  [source]
                </a>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
