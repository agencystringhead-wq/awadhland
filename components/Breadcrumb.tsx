export type BreadcrumbItem = {
  label: string;
  /** Omitted on the current page */
  href?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

/** BreadcrumbList JSON-LD is added in step 6. */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav data-component="Breadcrumb" aria-label="Breadcrumb" className="py-4 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href ? (
              <a href={item.href} className="text-ink-soft no-underline hover:text-accent">
                {item.label}
              </a>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
