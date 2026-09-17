import type { Locale } from "@/lib/i18n";

export type HowWeWorkProps = {
  locale: Locale;
  heading: string;
  steps: string[];
  /** About page adds the fee line: brokerage disclosed in writing before any visit */
  feeNote?: string;
};

/** Default copy from spec Template 9. Hindi to be written by a person. */
export const howWeWorkCopy: Record<Locale, { heading: string; steps: string[]; feeNote: string }> = {
  en: {
    heading: "How we work",
    steps: [
      "A 15-minute WhatsApp or call: you say what you want and your budget.",
      "A shortlist with rates, distances and what to check, in writing.",
      "Site visit, in person or on video for NRIs, with khatauni and land-use checks done before you travel.",
      "Paperwork through registry and mutation, with a written fee agreed up front.",
    ],
    feeNote: "Brokerage is disclosed in writing before any visit.",
  },
  hi: {
    heading: "हम कैसे काम करते हैं",
    steps: ["TODO: चरण 1, हिंदी किसी व्यक्ति द्वारा", "TODO: चरण 2", "TODO: चरण 3", "TODO: चरण 4"],
    feeNote: "TODO: फ़ीस की जानकारी",
  },
};

export function HowWeWork({ locale, heading, steps, feeNote }: HowWeWorkProps) {
  return (
    <section data-component="HowWeWork" data-locale={locale}>
      <h2>{heading}</h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={i} className="card p-5">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-accent text-sm font-semibold text-white">
              {i + 1}
            </span>
            <p className="mt-3 text-ink-soft">{s}</p>
          </li>
        ))}
      </ol>
      {feeNote && <p className="mt-4 text-sm text-muted">{feeNote}</p>}
    </section>
  );
}
