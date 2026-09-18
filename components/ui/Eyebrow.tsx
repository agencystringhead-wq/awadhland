import type { ReactNode } from "react";

export type EyebrowProps = {
  children: ReactNode;
  /** muted (default), accent-deep for section markers, gold on dark bands */
  tone?: "muted" | "accent" | "gold";
  /** Leading "— " as typed on the reference ("— Why we exist") */
  dash?: boolean;
  as?: "span" | "p" | "div";
  className?: string;
};

const toneClass = { muted: "", accent: "text-accent-deep", gold: "text-gold" } as const;

/** Mono 12px uppercase, 0.14em tracking (reference .eyebrow). */
export function Eyebrow({ children, tone = "muted", dash = false, as: Tag = "span", className = "" }: EyebrowProps) {
  return (
    <Tag data-component="Eyebrow" className={`eyebrow ${toneClass[tone]} ${className}`}>
      {dash && <span aria-hidden="true">— </span>}
      {children}
    </Tag>
  );
}
