import type { ReactNode } from "react";

export type CalloutProps = {
  title?: string;
  /** "note" uses the green accent, "warn" the maroon */
  tone?: "note" | "warn";
  children: ReactNode;
};

/** Guide MDX component: an aside the reader should not skip. Usage: <Callout title="…" tone="warn">markdown</Callout> */
export function Callout({ title, tone = "note", children }: CalloutProps) {
  const warn = tone === "warn";
  return (
    <aside
      data-component="Callout"
      className={`card mdx-block my-8 border-l-4 p-5 md:p-6 ${warn ? "border-l-maroon" : "border-l-accent"}`}
    >
      {title && <p className={`mb-1 text-sm font-semibold ${warn ? "text-maroon" : "text-accent"}`}>{title}</p>}
      <div className="text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </aside>
  );
}
