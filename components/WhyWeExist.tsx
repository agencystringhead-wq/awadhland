import type { Locale } from "@/lib/i18n";
import { Eyebrow } from "./ui/Eyebrow";

export type Pillar = { title: string; body: string };

export type WhyWeExistProps = {
  locale: Locale;
  /** Heading in the broker's voice; omitted when the enclosing Section already carries it */
  heading?: string;
  pillars: Pillar[];
};

/**
 * Default copy from spec Template 9 for the About page. The heading is broker-voice copy and the
 * Hindi pillars must be written by a person (spec Template 9 rules), so those stay marked TODO.
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

/**
 * Seed copy the content pipeline has not replaced yet. Rendering it puts the word TODO on the
 * About page, which is the last page that should look unfinished.
 */
const isTodo = (s: string) => /\bTODO\b/i.test(s);

/** True when any pillar is real copy. The Section wrapper is dropped when this is false. */
export const hasWhyWeExistCopy = (c: { pillars: Pillar[] }) => c.pillars.some((p) => !isTodo(p.title) && !isTodo(p.body));

/** Three pillars in a row with "01 — Title" mono markers over a hairline (reference §8 pillar). */
export function WhyWeExist({ locale, heading, pillars }: WhyWeExistProps) {
  // Seed copy is withheld, not shown. The Hindi pillars are TODO end to end, so on that tree the
  // whole block disappears until someone writes them; the English pillars are real and stay.
  const shownHeading = heading && !isTodo(heading) ? heading : undefined;
  const shownPillars = pillars.filter((p) => !isTodo(p.title) && !isTodo(p.body));
  if (shownPillars.length === 0) return null;
  return (
    <section data-component="WhyWeExist" data-locale={locale}>
      {shownHeading && <h2 className="max-w-3xl">{shownHeading}</h2>}
      <ul className={`grid gap-10 border-t border-line pt-12 md:grid-cols-3 md:gap-12 ${shownHeading ? "mt-12" : ""}`}>
        {shownPillars.map((p, i) => (
          <li key={p.title}>
            <Eyebrow tone="accent" className="mb-4 block">
              {String(i + 1).padStart(2, "0")} — {p.title}
            </Eyebrow>
            <h3 className="text-[26px] font-[450]">{p.title}</h3>
            <p className="mt-3.5 text-base leading-[1.6] text-ink-soft">{p.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
