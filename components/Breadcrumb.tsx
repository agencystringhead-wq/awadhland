export type BreadcrumbItem = {
  label: string;
  /** Omitted on the current page */
  href?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

/** Stub. BreadcrumbList JSON-LD is added in step 6. */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav data-component="Breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item) => (
          <li key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
