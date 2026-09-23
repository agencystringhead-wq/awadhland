import type { Locale } from "@/lib/i18n";
import { localePath, pick, ui } from "@/lib/i18n";
import { localityScore } from "@/lib/scoring";
import type { Locality } from "@/lib/schemas";
import { PriceBandChip } from "./PriceBandChip";

export type LocalityCardProps = {
  locale: Locale;
  locality: Locality;
  /** km, shown in "nearby localities" */
  distanceKm?: number;
};

export function LocalityCard({ locale, locality, distanceKm }: LocalityCardProps) {
  const t = ui[locale];
  const score = localityScore(locality);
  return (
    <article data-component="LocalityCard" className="card flex items-center justify-between gap-3 p-4">
      <div>
        <h3 className="text-base">
          <a href={localePath(locale, `/${locality.cityId}/${locality.id}/`)} className="text-ink no-underline hover:text-accent">
            {pick(locale, locality.name, locality.nameHi)}
          </a>
        </h3>
        <p className="text-sm text-muted">
          {locality.tehsil}
          {distanceKm !== undefined && (
            <>
              {" · "}
              {distanceKm} {t.km}
            </>
          )}
          {score !== undefined && (
            <>
              {" · "}
              {t.score} {score}
            </>
          )}
        </p>
      </div>
      {locality.priceBand && <PriceBandChip locale={locale} band={locality.priceBand} />}
    </article>
  );
}
