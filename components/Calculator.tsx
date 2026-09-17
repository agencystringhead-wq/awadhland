import type { ReactNode } from "react";

export type CalculatorProps = {
  title: string;
  /** Rendered when JavaScript is off: static explainer and a link to the relevant data page (spec Template 7 rules). */
  fallback: ReactNode;
  /** Inputs column */
  inputs?: ReactNode;
  /** Result column */
  result?: ReactNode;
};

/** Shared tool shell: inputs left, result right on desktop, stacked on mobile. Each tool passes its own compute in step 5. */
export function Calculator({ title, fallback, inputs, result }: CalculatorProps) {
  return (
    <section data-component="Calculator" className="card p-5 md:p-6">
      <h2>{title}</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>{inputs}</div>
        <div className="rounded-card bg-cream-deep p-4">{result}</div>
      </div>
      <noscript>
        <div className="mt-4 text-ink-soft">{fallback}</div>
      </noscript>
    </section>
  );
}
