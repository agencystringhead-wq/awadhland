import type { Locale } from "@/lib/i18n";
import type { ProjectStatus } from "@/lib/schemas";

/** Colour map for status and price band chips is defined once, in step 2. */
export const statusLabels: Record<ProjectStatus, Record<Locale, string>> = {
  announced: { en: "Announced", hi: "घोषित" },
  approved: { en: "Approved", hi: "स्वीकृत" },
  "under-construction": { en: "Under construction", hi: "निर्माणाधीन" },
  "partially-open": { en: "Partially open", hi: "आंशिक रूप से चालू" },
  complete: { en: "Complete", hi: "पूर्ण" },
  stalled: { en: "Stalled", hi: "रुका हुआ" },
};

export type StatusChipProps = {
  locale: Locale;
  status: ProjectStatus;
};

/** Stub. */
export function StatusChip({ locale, status }: StatusChipProps) {
  return (
    <span data-component="StatusChip" data-status={status}>
      {statusLabels[status][locale]}
    </span>
  );
}
