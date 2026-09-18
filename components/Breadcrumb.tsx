import { SITE_URL } from "@/lib/i18n";
import { breadcrumbList } from "@/lib/jsonld";
import { JsonLd } from "./JsonLd";

export type BreadcrumbItem = {
  label: string;
  /** Omitted on the current page */
  href?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

/** Visible trail plus BreadcrumbList JSON-LD from the same items; the current page carries no URL. */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <>
      <JsonLd data={breadcrumbList(items.map((it) => ({ name: it.label, url: it.href ? `${SITE_URL}${it.href.replace(/#.*$/, "")}` : undefined })))} />
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
    </>
  );
}
