import type { Locale } from "@/lib/i18n";

export type Pillar = { title: string; body: string };

export type WhyWeExistProps = {
  locale: Locale;
  /** Heading in the broker's voice */
  heading: string;
  pillars: Pillar[];
};

/** Default copy from spec Template 9. Broker-voice copy: the Hindi version must be written by a person, not a model. */
export const whyWeExistCopy: Record<Locale, { heading: string; pillars: Pillar[] }> = {
  en: {
    heading: "TODO: heading in the broker's voice",
    pillars: [
      { title: "Verified", body: "Every rate, distance and project has a source and date." },
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

/** Stub. */
export function WhyWeExist({ locale, heading, pillars }: WhyWeExistProps) {
  return (
    <section data-component="WhyWeExist" data-locale={locale}>
      <h2>{heading}</h2>
      <ul>
        {pillars.map((p, i) => (
          <li key={i}>
            <strong>{p.title}</strong> {p.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
