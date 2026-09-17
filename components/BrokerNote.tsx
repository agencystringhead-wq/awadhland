import type { Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";

export type BrokerNoteProps = {
  locale: Locale;
  note: string;
  date: string;
  broker: Pick<TeamMember, "name" | "nameHi" | "photo">;
};

/** Stub. Quote style, photo, date. */
export function BrokerNote({ locale, note, date, broker }: BrokerNoteProps) {
  return (
    <figure data-component="BrokerNote">
      <blockquote>{note}</blockquote>
      <figcaption>
        {locale === "hi" ? broker.nameHi : broker.name}, <time dateTime={date}>{formatDate(date, locale)}</time>
      </figcaption>
    </figure>
  );
}
