import { localePath, ui, type Locale } from "@/lib/i18n";

/**
 * "Before you buy: 30-point checklist": the land safety checklist, linked from every locality and
 * village page. A plain link, so it works in both server and client components.
 */
export function BeforeYouBuyCard({ locale, className = "" }: { locale: Locale; className?: string }) {
  const t = ui[locale];
  return (
    <a
      data-component="BeforeYouBuyCard"
      href={localePath(locale, "/guides/land-safety-checklist/")}
      className={`flex items-start gap-4 rounded-2xl border border-line bg-card p-5 no-underline transition-colors hover:bg-cream-deep ${className}`}
    >
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-deep">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4h14v16H5zM8 9l1.5 1.5L12 8M8 14l1.5 1.5L12 13M14 9h3M14 14h3" />
        </svg>
      </span>
      <span>
        <span className="block font-semibold text-ink">{t.beforeYouBuy} →</span>
        <span className="mt-1 block text-sm text-ink-soft">{t.beforeYouBuyBody}</span>
      </span>
    </a>
  );
}
