import type { ReactNode } from "react";

export type ChecklistProps = {
  title?: string;
  /** A markdown list. Unordered items get a tick mark; ordered lists keep their numbers. */
  children: ReactNode;
};

/** Guide MDX component: a boxed list of checks. Usage: <Checklist title="…">- item</Checklist> */
export function Checklist({ title, children }: ChecklistProps) {
  return (
    <section data-component="Checklist" className="card mdx-block checklist my-8 p-5 md:p-6">
      {title && <h3 className="mb-3">{title}</h3>}
      {children}
    </section>
  );
}
