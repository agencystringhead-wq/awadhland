import type { Locale } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";

export type BadgesProps = {
  locale: Locale;
  broker: Pick<TeamMember, "reraNumber" | "reraUrl" | "yearsActive">;
  citiesCovered: number;
  googleRating?: number;
  memberships?: string[];
};

/** Stub. RERA number, Google rating, years active, cities covered, memberships. */
export function Badges({ locale, broker, citiesCovered, googleRating, memberships = [] }: BadgesProps) {
  return (
    <ul data-component="Badges" data-locale={locale}>
      {broker.reraNumber && <li>{broker.reraUrl ? <a href={broker.reraUrl}>{broker.reraNumber}</a> : broker.reraNumber}</li>}
      {googleRating !== undefined && <li>Google {googleRating}</li>}
      <li>{broker.yearsActive}</li>
      <li>{citiesCovered}</li>
      {memberships.map((m) => (
        <li key={m}>{m}</li>
      ))}
    </ul>
  );
}
