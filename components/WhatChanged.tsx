import type { Locale } from "@/lib/i18n";
import type { Update } from "@/lib/schemas";
import { UpdateRow } from "./UpdateRow";

export type WhatChangedProps = {
  locale: Locale;
  /** Newest first; the caller passes the three newest. */
  updates: Update[];
};

/** Stub. Homepage strip of the three newest updates. */
export function WhatChanged({ locale, updates }: WhatChangedProps) {
  if (updates.length === 0) return null;
  return (
    <section data-component="WhatChanged">
      {updates.slice(0, 3).map((u) => (
        <UpdateRow key={u.id} locale={locale} update={u} />
      ))}
    </section>
  );
}
