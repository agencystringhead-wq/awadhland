import type { Locale } from "@/lib/i18n";
import { localePath, ui } from "@/lib/i18n";
import type { City, Update } from "@/lib/schemas";
import { UpdateRow } from "./UpdateRow";

export type WhatChangedProps = {
  locale: Locale;
  /** Newest first; only the three newest render. */
  updates: Update[];
  cities: Pick<City, "id" | "name" | "nameHi">[];
};

/** Homepage strip of the three newest updates (spec Template 1, section 3). */
export function WhatChanged({ locale, updates, cities }: WhatChangedProps) {
  if (updates.length === 0) return null;
  const t = ui[locale];
  return (
    <section data-component="WhatChanged" className="card p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg">{t.whatChanged}</h2>
        <a href={localePath(locale, "/updates/")} className="text-sm font-medium">
          {t.allUpdates} →
        </a>
      </div>
      <div className="mt-2">
        {updates.slice(0, 3).map((u) => (
          <UpdateRow key={u.id} locale={locale} update={u} cities={cities} />
        ))}
      </div>
    </section>
  );
}
