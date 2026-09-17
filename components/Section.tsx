import type { ReactNode } from "react";

export type SectionProps = {
  id?: string;
  title?: string;
  /** Right-aligned link or note beside the title */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Page section with the spec's generous vertical rhythm (--section-gap in globals.css). */
export function Section({ id, title, aside, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={`section ${className}`}>
      <div className="container-site">
        {title && (
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2>{title}</h2>
            {aside && <div className="text-sm">{aside}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
