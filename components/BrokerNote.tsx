import type { Locale } from "@/lib/i18n";
import { formatDate, pick, ui } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";

export type BrokerNoteProps = {
  locale: Locale;
  note: string;
  date: string;
  broker: Pick<TeamMember, "name" | "nameHi" | "photo">;
};

/** Quote style, photo, date. First person, in the broker's voice. */
export function BrokerNote({ locale, note, date, broker }: BrokerNoteProps) {
  const t = ui[locale];
  return (
    <figure data-component="BrokerNote" className="card flex gap-4 border-l-4 border-l-accent p-5 md:p-6">
      {/* Plain img on purpose: media is pre-encoded WebP on R2 (CLAUDE.md), and next/image adds client JS. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={broker.photo} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full bg-cream-deep object-cover" />
      <div>
        <p className="text-sm font-semibold text-accent">{t.brokerNote}</p>
        <blockquote className="mt-1 text-[17px] leading-relaxed text-ink">{note}</blockquote>
        <figcaption className="mt-2 text-sm text-muted">
          {pick(locale, broker.name, broker.nameHi)} · <time dateTime={date}>{formatDate(date, locale)}</time>
        </figcaption>
      </div>
    </figure>
  );
}
