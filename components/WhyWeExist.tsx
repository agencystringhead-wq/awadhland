import type { Locale } from "@/lib/i18n";

export type Pillar = { title: string; body: string };

export type WhyWeExistProps = {
  locale: Locale;
  /** Heading in the broker's voice */
  heading: string;
  pillars: Pillar[];
};

/**
 * Default copy from spec Template 9. The heading is broker-voice copy and the Hindi pillars must be
 * written by a person, not a model (spec Template 9 rules), so those stay marked TODO.
 */
export const whyWeExistCopy: Record<Locale, { heading: string; pillars: Pillar[] }> = {
  en: {
    heading: "TODO: heading in the broker's voice",
    pillars: [
      { title: "Verified", body: "Every rate, distance and project has a source and a date." },
      { title: "Plain", body: "Hindi and English, no jargon, no pressure." },
      { title: "Local", body: "Native to the region, on the ground every week, will walk the plot with you." },
    ],
  },
  hi: {
    heading: "TODO: ब्रोकर की आवाज़ में शीर्षक",
    pillars: [
      { title: "TODO", body: "TODO: Verified pillar, Hindi by a person" },
      { title: "TODO", body: "TODO: Plain pillar, Hindi by a person" },
      { title: "TODO", body: "TODO: Local pillar, Hindi by a person" },
    ],
  },
};

export function WhyWeExist({ locale, heading, pillars }: WhyWeExistProps) {
  return (
    <section data-component="WhyWeExist" data-locale={locale}>
      <h2 className="max-w-3xl">{heading}</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {pillars.map((p, i) => (
          <li key={i} className="card p-5">
            <h3 className="text-accent">{p.title}</h3>
            <p className="mt-1.5 text-ink-soft">{p.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
