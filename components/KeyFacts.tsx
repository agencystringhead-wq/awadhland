export type KeyFact = {
  label: string;
  value: string;
  sourceUrl?: string;
};

export type KeyFactsProps = {
  facts: KeyFact[];
};

/** Stub. Definition list with source footnotes. Empty values are omitted by the caller (spec Template 3 rules). */
export function KeyFacts({ facts }: KeyFactsProps) {
  if (facts.length === 0) return null;
  return (
    <dl data-component="KeyFacts">
      {facts.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>
            {f.value}
            {f.sourceUrl && (
              <>
                {" "}
                <a href={f.sourceUrl}>[source]</a>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
