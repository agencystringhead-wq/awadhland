import type { ReactNode } from "react";
import { Eyebrow } from "./ui/Eyebrow";

export type SectionSize = "base" | "lg" | "xl" | "tight";
export type SectionTone = "paper" | "surface" | "sand" | "ink" | "gradient";

export type SectionProps = {
  id?: string;
  /**
   * Plain h2 title (page templates). For the homepage framing use `eyebrow` + `heading` + `accent`
   * + `lede` instead; both may not be combined.
   */
  title?: string;
  /** Right-aligned link or note beside the title */
  aside?: ReactNode;
  /** Mono eyebrow above the heading; the leading "— " is added here (reference §12) */
  eyebrow?: string;
  /** Display heading (h-section). The trailing `accent` renders as the italic touch */
  heading?: string;
  accent?: string;
  /** One serif line under the heading */
  lede?: string;
  /** 96 / 112 / 140 desktop rhythm; 72 at ≤980, 46 at ≤640 (reference §4) */
  size?: SectionSize;
  tone?: SectionTone;
  /** Hairline on the top edge, used when adjacent tones are close */
  hairline?: boolean;
  /** 880px block instead of 1240 (reference .wrap-narrow) */
  narrow?: boolean;
  headingLevel?: "h1" | "h2";
  children: ReactNode;
  className?: string;
};

const sizeClass: Record<SectionSize, string> = { base: "section", lg: "section-lg", xl: "section-xl", tight: "section-tight" };
const toneClass: Record<SectionTone, string> = {
  paper: "bg-cream",
  surface: "bg-card",
  sand: "bg-cream-deep",
  ink: "panel-ink",
  gradient: "panel-gradient",
};

/**
 * Page section primitive. Every section on the site uses it so spacing is identical.
 * Framing that repeats on the reference: eyebrow → display h2 with one italic phrase → lede → content.
 */
export function Section({
  id,
  title,
  aside,
  eyebrow,
  heading,
  accent,
  lede,
  size = "base",
  tone = "paper",
  hairline = false,
  narrow = false,
  headingLevel = "h2",
  children,
  className = "",
}: SectionProps) {
  const H = headingLevel;
  const onInk = tone === "ink";
  return (
    <section id={id} className={`${sizeClass[size]} ${toneClass[tone]} ${hairline ? "hairline" : ""} ${className}`}>
      <div className={narrow ? "container-narrow" : "container-site"}>
        {title && (
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
            <H className={onInk ? "text-card" : undefined}>{title}</H>
            {aside && <div className="text-sm">{aside}</div>}
          </div>
        )}
        {heading && (
          <header className="mb-10 md:mb-14">
            {eyebrow && <Eyebrow tone={onInk ? "gold" : "accent"} className="mb-5 block" dash>{eyebrow}</Eyebrow>}
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <H className={`h-section max-w-4xl ${onInk ? "text-card" : ""}`}>
                {heading}
                {accent && (
                  <>
                    {" "}
                    <span className="italic-touch">{accent}</span>
                  </>
                )}
              </H>
              {aside && <div className="text-sm">{aside}</div>}
            </div>
            {lede && <p className={`lede mt-5 max-w-2xl ${onInk ? "text-[rgb(251_247_239_/_0.78)]" : ""}`}>{lede}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
