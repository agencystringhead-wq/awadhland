import type { Locale } from "@/lib/i18n";

export type HowWeWorkProps = {
  locale: Locale;
  steps: string[];
  /** About page adds the fee line: brokerage disclosed in writing before any visit */
  feeNote?: string;
};

/** Default copy from spec Template 9. Hindi to be written by a person. */
export const howWeWorkCopy: Record<Locale, { steps: string[]; feeNote: string }> = {
  en: {
    steps: [
      "A 15-minute WhatsApp or call: you say what you want and your budget.",
      "A shortlist with rates, distances and what to check, in writing.",
      "Site visit, in person or on video for NRIs, with khatauni and land-use checks done before you travel.",
      "Paperwork through registry and mutation, with a written fee agreed up front.",
    ],
    feeNote: "Brokerage is disclosed in writing before any visit.",
  },
  hi: {
    steps: ["TODO: चरण 1, हिंदी किसी व्यक्ति द्वारा", "TODO: चरण 2", "TODO: चरण 3", "TODO: चरण 4"],
    feeNote: "TODO: फ़ीस की जानकारी",
  },
};

/** Stub. Four numbered steps. */
export function HowWeWork({ locale, steps, feeNote }: HowWeWorkProps) {
  return (
    <section data-component="HowWeWork" data-locale={locale}>
      <ol>
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {feeNote && <p>{feeNote}</p>}
    </section>
  );
}
