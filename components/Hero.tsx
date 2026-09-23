import { Section } from "@/components/Section";
import { Button, PhoneIcon } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/Pill";
import { fill, type HomeStory } from "@/lib/content";
import { pick, type Locale } from "@/lib/i18n";
import { brokerIsRegistered, withoutUnbackedReraClaim } from "@/lib/guards";
import type { TeamMember } from "@/lib/schemas";
import { EnquiryForm } from "./EnquiryForm";
import { Stars } from "./TopStrip";

export type HeroProps = {
  locale: Locale;
  story: HomeStory;
  broker: Pick<TeamMember, "name" | "nameHi" | "phone" | "whatsapp" | "reraNumber" | "reraUrl" | "yearsActive" | "photo">;
  /** Google Business Profile URL for "Rated on Google →". Absent until the profile exists. */
  reviewsUrl?: string;
};

/** +91 XXXXX XXXXX from the E.164 number in team.json. */
export const formatPhone = (e164: string) => e164.replace(/^(\+91)(\d{5})(\d{5})$/, "$1 $2 $3");

/**
 * Homepage hero, layout (a) from docs/DESIGN-REFERENCE.md §9: one 54% text column with the form
 * card and the broker card under the copy; the portrait floats right, absolutely positioned at
 * ≥1180px with the vertical feather mask, and drops into the flow as a card below that.
 *
 * The portrait is broker.photo from team.json: a transparent-background cutout committed at
 * 950 × 1183 (2× of the 475px render). TODO(media): move it to R2 once the bucket exists.
 */
export function Hero({ locale, story, broker, reviewsUrl }: HeroProps) {
  const h = story.hero;
  const vars = { years: broker.yearsActive, phone: formatPhone(broker.phone) };
  const trust = withoutUnbackedReraClaim(story.form.trust, brokerIsRegistered(broker)).map((s) => fill(s, vars));
  const portrait = (
    // Plain img on purpose: media is pre-encoded WebP (CLAUDE.md), and next/image adds client JS.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={broker.photo}
      alt={pick(locale, broker.name, broker.nameHi)}
      width={950}
      height={1183}
      fetchPriority="high"
      className="h-auto w-full object-contain [mask-image:linear-gradient(#000_40%,rgba(0,0,0,.55)_66%,transparent_88%)]"
    />
  );

  return (
    <Section size="hero" tone="gradient" className="relative overflow-hidden">
      <div className="relative">
        {/* Portrait: absolute at ≥1180 (reference: left 792px of 1176, width 475) */}
        <div aria-hidden="true" className="pointer-events-none absolute top-0 hidden w-[40.4%] min-[1180px]:left-[67.3%] min-[1180px]:block">
          {portrait}
        </div>

        <div className="min-[1180px]:max-w-[54%]">
          {/* a. status pill */}
          <StatusPill className="mb-7">{h.status}</StatusPill>

          {/* c. h1: two lines, italic touch on the second. The italic line measures 788px at 88px, so the
              heading may run past the 635px column up to the portrait's feathered edge (792px). */}
          <h1 className="h-display mb-7 max-w-[635px] min-[1180px]:w-[800px] min-[1180px]:max-w-none">
            {h.title}
            <br />
            <span className="italic-touch">{h.accent}</span>
          </h1>

          {/* d. lede with a trailing italic in ink */}
          <p className="lede mb-9 max-w-[560px]">
            {h.lede} <em className="serif-italic text-ink">{h.ledeAccent}</em>
          </p>

          {/* e. buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Button href="#checklist" variant="primary">
              {h.ctaPrimary}
            </Button>
            <Button href={`tel:${broker.phone}`} variant="soft" icon={<PhoneIcon />}>
              {h.call} <span className="tabular-nums">{formatPhone(broker.phone)}</span>
            </Button>
          </div>

          {/* f. muted note */}
          <p className="serif-italic mb-14 text-[13px] leading-[1.55] text-muted">{h.note}</p>

          {/* b. (below 1180) portrait in the flow as a card */}
          <div className="card-raised mb-10 max-w-[380px] overflow-hidden rounded-[24px] bg-cream-deep p-0 min-[1180px]:hidden">{portrait}</div>

          {/* Form card: 580 wide, 26/30/28 padding, radius 18 */}
          <div className="card-raised max-w-[580px] px-6 pb-7 pt-[26px] md:px-[30px]">
            <div className="mb-[18px] border-b border-line pb-3.5">
              <p className="label-mono flex items-center gap-2 text-accent-deep">
                <span aria-hidden="true" className="dot-gold" />
                {story.form.eyebrow}
              </p>
              <p className="mt-2 font-display text-[22px] font-medium leading-tight tracking-[-0.012em] text-ink">{story.form.intro}</p>
            </div>
            <EnquiryForm locale={locale} variant="hero" copy={{ ...story.form, trust }} whatsapp={broker.whatsapp} phoneDisplay={formatPhone(broker.phone)} trust={trust} />
          </div>

          {/* Broker card: 580 × ~110, radius 12, name + RERA sub-line, italic note, stars right */}
          <div className="card-glass mt-6 flex max-w-[580px] flex-wrap items-center gap-[18px] rounded-[12px] px-5 py-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={broker.photo} alt="" width={44} height={44} className="size-11 shrink-0 rounded-full bg-cream-deep object-cover object-top" />
            <div className="min-w-0">
              <p className="caption-mono">{story.broker.eyebrow}</p>
              <p className="font-display text-[15px] font-medium leading-tight text-ink">
                {pick(locale, broker.name, broker.nameHi)}{" "}
                <span lang={locale === "hi" ? "en" : "hi"} className="font-normal text-muted">
                  {pick(locale, broker.nameHi, broker.name)}
                </span>
              </p>
              <p className="caption-mono mt-0.5 text-[9.5px]">
                {/* No registration number, no registration claim: lib/guards.ts nulls a placeholder one. */}
                {broker.reraNumber && (
                  <>
                    UP RERA{" "}
                    {broker.reraUrl ? (
                      <a href={broker.reraUrl} rel="noopener" className="text-muted">
                        {broker.reraNumber}
                      </a>
                    ) : (
                      broker.reraNumber
                    )}{" "}
                    ·{" "}
                  </>
                )}
                {story.broker.native}
              </p>
            </div>
            <p className="serif-italic flex-[1_1_200px] border-l border-line pl-[18px] text-[13px] leading-[1.45] text-ink-soft">
              {fill(story.broker.line, vars)}
            </p>
            {/* "Rated on Google" only once there is a profile to point at (spec Template 9). */}
            {reviewsUrl && (
              <a href={reviewsUrl} rel="noopener" className="ml-auto flex items-center gap-2 caption-mono text-[9.5px] no-underline hover:text-accent-deep">
                <Stars size={12} />
                {story.broker.rated}
              </a>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
