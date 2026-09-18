import type { Locale } from "@/lib/i18n";
import { formatDate, localePath, pick } from "@/lib/i18n";
import type { City, Update } from "@/lib/schemas";
import { updateTypeLabels } from "./UpdateRow";
import { Chip } from "./ui/Pill";

export type WhatChangedProps = {
  locale: Locale;
  /** Newest first; only the three newest render. */
  updates: Update[];
  cities: Pick<City, "id" | "name" | "nameHi">[];
  allLabel: string;
};

/** Homepage strip of the three newest updates (spec Template 1, section 3): hairline-bordered flat card, dated rows. */
export function WhatChanged({ locale, updates, cities, allLabel }: WhatChangedProps) {
  if (updates.length === 0) return null;
  const cityName = (id: string) => {
    const c = cities.find((x) => x.id === id);
    return c ? pick(locale, c.name, c.nameHi) : id;
  };
  return (
    <div data-component="WhatChanged" className="card overflow-hidden p-0">
      <ol className="divide-y divide-line">
        {updates.slice(0, 3).map((u) => (
          <li key={u.id} className="grid gap-2 px-6 py-5 md:grid-cols-[150px_1fr_auto] md:items-baseline md:gap-6">
            <time dateTime={u.date} className="caption-mono">
              {formatDate(u.date, locale)}
            </time>
            <div className="min-w-0">
              <h3 className="text-[19px]">
                <a href={localePath(locale, `/updates/${u.id}/`)} className="text-ink no-underline hover:text-accent-deep">
                  {pick(locale, u.title, u.titleHi)}
                </a>
              </h3>
              <p className="mt-1 line-clamp-2 text-[15px] text-ink-soft">{pick(locale, u.summary, u.summaryHi)[0]}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 md:justify-end">
              <Chip>{updateTypeLabels[u.type][locale]}</Chip>
              {u.cityIds.slice(0, 2).map((c) => (
                <Chip key={c}>{cityName(c)}</Chip>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-line bg-cream-deep/60 px-6 py-3 text-right">
        <a href={localePath(locale, "/updates/")} className="text-[13.5px] font-semibold text-accent-deep no-underline hover:underline">
          {allLabel}
        </a>
      </p>
    </div>
  );
}
