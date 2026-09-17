import type { Locale } from "@/lib/i18n";
import type { ProjectStatus } from "@/lib/schemas";

export const statusLabels: Record<ProjectStatus, Record<Locale, string>> = {
  announced: { en: "Announced", hi: "घोषित" },
  approved: { en: "Approved", hi: "स्वीकृत" },
  "under-construction": { en: "Under construction", hi: "निर्माणाधीन" },
  "partially-open": { en: "Partially open", hi: "आंशिक रूप से चालू" },
  complete: { en: "Complete", hi: "पूर्ण" },
  stalled: { en: "Stalled", hi: "रुका हुआ" },
};

/** Colour map defined once (spec Shared components). Token names live in app/globals.css. */
const statusClass: Record<ProjectStatus, string> = {
  announced: "bg-status-announced",
  approved: "bg-status-approved",
  "under-construction": "bg-status-under-construction",
  "partially-open": "bg-status-partially-open",
  complete: "bg-status-complete",
  stalled: "bg-status-stalled",
};

export type StatusChipProps = {
  locale: Locale;
  status: ProjectStatus;
};

export function StatusChip({ locale, status }: StatusChipProps) {
  return (
    <span data-component="StatusChip" data-status={status} className={`chip ${statusClass[status]}`}>
      {statusLabels[status][locale]}
    </span>
  );
}
