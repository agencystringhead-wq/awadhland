import type { Locale } from "@/lib/i18n";

export type Step = string | { title: string; body: string };

export type HowWeWorkProps = {
  locale: Locale;
  /** Omitted when the enclosing Section carries the heading */
  heading?: string;
  steps: Step[];
  /** About page adds the fee line: brokerage disclosed in writing before any visit */
  feeNote?: string;
};

/** Default copy from spec Template 9 for the About page. Hindi to be written by a person. */
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

/**
 * Seed copy the content pipeline has not replaced. Withheld rather than rendered: the Hindi steps
 * and fee note are TODO end to end, and a numbered list of the word TODO is worse than no list.
 */
const isTodo = (s: string) => /\bTODO\b/i.test(s);

/** True when any step is real copy. The Section wrapper is dropped when this is false. */
export const hasHowWeWorkCopy = (c: { steps: HowWeWorkProps["steps"] }) =>
  c.steps.some((s) => !isTodo(typeof s === "string" ? s : `${s.title ?? ""} ${s.body}`));

/** Four numbered steps in a row with hairlines between (reference §8 step card, 56px serif numerals). */
export function HowWeWork({ locale, heading, steps, feeNote }: HowWeWorkProps) {
  const text = (s: (typeof steps)[number]) => (typeof s === "string" ? s : `${s.title ?? ""} ${s.body}`);
  const shownSteps = steps.filter((s) => !isTodo(text(s)));
  const shownHeading = heading && !isTodo(heading) ? heading : undefined;
  const shownFeeNote = feeNote && !isTodo(feeNote) ? feeNote : undefined;
  if (shownSteps.length === 0) return null;
  return (
    <section data-component="HowWeWork" data-locale={locale}>
      {shownHeading && <h2>{shownHeading}</h2>}
      <ol className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 ${shownHeading ? "mt-8" : ""}`}>
        {shownSteps.map((s, i) => {
          const step = typeof s === "string" ? { title: undefined, body: s } : s;
          return (
            <li key={i} className={`lg:px-7 ${i > 0 ? "lg:border-l lg:border-line" : "lg:pl-0"}`}>
              <span aria-hidden="true" className="block font-display text-[56px] font-light leading-none tracking-[-0.02em] text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              {step.title && <h3 className="mb-2.5 mt-[18px] text-[22px] font-medium">{step.title}</h3>}
              <p className={`text-[14.5px] leading-[1.55] text-ink-soft ${step.title ? "" : "mt-4"}`}>{step.body}</p>
            </li>
          );
        })}
      </ol>
      {shownFeeNote && <p className="serif-italic mt-8 text-[13px] text-muted">{shownFeeNote}</p>}
    </section>
  );
}
