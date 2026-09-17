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

/** Stub. Shared tool shell: inputs left, result right on desktop, stacked on mobile. Client compute wiring in step 5. */
export function Calculator({ title, fallback, inputs, result }: CalculatorProps) {
  return (
    <section data-component="Calculator">
      <h2>{title}</h2>
      <div>{inputs}</div>
      <div>{result}</div>
      <noscript>{fallback}</noscript>
    </section>
  );
}
