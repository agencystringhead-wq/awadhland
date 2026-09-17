import type { Locale } from "@/lib/i18n";
import { localePath, pick } from "@/lib/i18n";
import type { Locality } from "@/lib/schemas";
import { PriceBandChip } from "./PriceBandChip";

export type LocalityCardProps = {
  locale: Locale;
  locality: Pick<Locality, "id" | "cityId" | "name" | "nameHi" | "priceBand" | "score">;
  /** km, shown in "nearby localities" */
  distanceKm?: number;
};

/** Stub. */
export function LocalityCard({ locale, locality, distanceKm }: LocalityCardProps) {
  return (
    <article data-component="LocalityCard">
      <h3>
        <a href={localePath(locale, `/${locality.cityId}/${locality.id}/`)}>{pick(locale, locality.name, locality.nameHi)}</a>
      </h3>
      {locality.priceBand && <PriceBandChip locale={locale} band={locality.priceBand} />}
      {locality.score !== undefined && <p>Score {locality.score}</p>}
      {distanceKm !== undefined && <p>{distanceKm} km</p>}
    </article>
  );
}
