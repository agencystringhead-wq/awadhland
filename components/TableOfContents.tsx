import type { Heading } from "@/lib/guide-files";

export type TableOfContentsProps = {
  label: string;
  headings: Heading[];
};

/**
 * Spec Template 6, section 2: H2 list, sticky on desktop. Rendered twice by the guide template:
 * inside a collapsed <details> above the body on small screens, and in the sticky aside on large ones.
 */
export function TableOfContents({ label, headings }: TableOfContentsProps) {
  if (headings.length === 0) return null;
  return (
    <nav data-component="TableOfContents" aria-label={label}>
      <ol className="space-y-2 text-[15px]">
        {headings.map((h, i) => (
          <li key={h.id} className="flex gap-2.5">
            <span aria-hidden="true" className="w-5 shrink-0 tabular-nums text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <a href={`#${h.id}`} className="text-ink-soft no-underline hover:text-accent">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
