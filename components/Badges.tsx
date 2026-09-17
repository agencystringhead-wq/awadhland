import type { Locale } from "@/lib/i18n";
import { ui } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";

export type BadgesProps = {
  locale: Locale;
  broker: Pick<TeamMember, "reraNumber" | "reraUrl" | "yearsActive">;
  citiesCovered: number;
  googleRating?: number;
  memberships?: string[];
};

/** Footer band and About page: RERA number, Google rating, years active, cities covered, memberships. */
export function Badges({ locale, broker, citiesCovered, googleRating, memberships = [] }: BadgesProps) {
  const t = ui[locale];
  const badge = "flex items-baseline gap-1.5 rounded-chip border border-line bg-card px-3 py-1.5 text-sm";
  return (
    <ul data-component="Badges" data-locale={locale} className="flex flex-wrap gap-2">
      {broker.reraNumber && (
        <li className={badge}>
          <span className="text-muted">UP RERA</span>
          {broker.reraUrl ? (
            <a href={broker.reraUrl} rel="noopener" className="font-semibold">
              {broker.reraNumber}
            </a>
          ) : (
            <span className="font-semibold">{broker.reraNumber}</span>
          )}
        </li>
      )}
      {googleRating !== undefined && (
        <li className={badge}>
          <span className="text-muted">Google</span>
          <span className="font-semibold">★ {googleRating}</span>
        </li>
      )}
      <li className={badge}>
        <span className="font-semibold">{broker.yearsActive}</span>
        <span className="text-muted">{t.yearsInAyodhya}</span>
      </li>
      <li className={badge}>
        <span className="font-semibold">{citiesCovered}</span>
        <span className="text-muted">{t.cities}</span>
      </li>
      {memberships.map((m) => (
        <li key={m} className={badge}>
          {m}
        </li>
      ))}
    </ul>
  );
}
