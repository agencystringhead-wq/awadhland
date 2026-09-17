import type { Locale } from "@/lib/i18n";
import { formatNumber, localePath, pick, ui } from "@/lib/i18n";
import type { City, Locality } from "@/lib/schemas";

export type CityCardProps = {
  locale: Locale;
  city: Pick<City, "id" | "name" | "nameHi" | "intro" | "introHi">;
  stats: {
    localityCount: number;
    askingRange: { low: number; high: number } | null;
    topLocalities: Pick<Locality, "id" | "name" | "nameHi" | "score">[];
  };
  /** Ayodhya renders first and larger (spec Template 1, section 4) */
  hero?: boolean;
};

export function CityCard({ locale, city, stats, hero = false }: CityCardProps) {
  const t = ui[locale];
  const name = pick(locale, city.name, city.nameHi);
  return (
    <article data-component="CityCard" className={`card flex flex-col p-5 md:p-6 ${hero ? "md:col-span-2 md:row-span-2" : ""}`}>
      <h3 className={hero ? "text-2xl" : "text-xl"}>
        <a href={localePath(locale, `/${city.id}/`)} className="text-ink no-underline hover:text-accent">
          {name}
        </a>
      </h3>
      <p lang={locale === "hi" ? "en" : "hi"} className="text-muted">
        {pick(locale, city.nameHi, city.name)}
      </p>
      {hero && <p className="mt-3 line-clamp-4 text-ink-soft">{pick(locale, city.intro, city.introHi)}</p>}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {stats.askingRange && (
          <div>
            <dt className="text-muted">{t.priceBand}</dt>
            <dd className="font-semibold tabular-nums">
              ₹{formatNumber(stats.askingRange.low)}–{formatNumber(stats.askingRange.high)}{" "}
              <span className="font-normal text-muted">{t.perSqFt}</span>
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted">{t.localities}</dt>
          <dd className="font-semibold tabular-nums">{stats.localityCount}</dd>
        </div>
      </dl>
      {stats.topLocalities.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted">{t.topAreas}</p>
          <ol className="mt-1 space-y-1">
            {stats.topLocalities.slice(0, 3).map((l) => (
              <li key={l.id} className="flex justify-between gap-3 text-[15px]">
                <a href={localePath(locale, `/${city.id}/${l.id}/`)} className="no-underline hover:underline">
                  {pick(locale, l.name, l.nameHi)}
                </a>
                <span className="tabular-nums text-muted">{l.score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <a href={localePath(locale, `/${city.id}/`)} className="mt-auto pt-5 text-sm font-medium">
        {t.viewCity} →
      </a>
    </article>
  );
}
