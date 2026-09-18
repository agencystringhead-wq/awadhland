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
  /** Ayodhya renders first and spans two columns (spec Template 1, section 4) */
  hero?: boolean;
  labels: { seeCity: string; topAreas: string; priceBand: string };
};

/** City card: name in both scripts, two-line market read, asking range, top three areas with score, link. */
export function CityCard({ locale, city, stats, hero = false, labels }: CityCardProps) {
  const t = ui[locale];
  const name = pick(locale, city.name, city.nameHi);
  return (
    <article data-component="CityCard" className={`card flex flex-col p-7 ${hero ? "md:col-span-2" : ""}`}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className={hero ? "text-[32px]" : "text-[26px]"}>
          <a href={localePath(locale, `/${city.id}/`)} className="text-ink no-underline hover:text-accent-deep">
            {name}
          </a>
        </h3>
        <p lang={locale === "hi" ? "en" : "hi"} className="font-display text-lg text-muted">
          {pick(locale, city.nameHi, city.name)}
        </p>
      </div>
      <p className="mt-3 line-clamp-2 max-w-[62ch] text-[15px] leading-[1.55] text-ink-soft">{pick(locale, city.intro, city.introHi)}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
        {stats.askingRange && (
          <div className="flex flex-col-reverse gap-1">
            <dt className="caption-mono">{labels.priceBand}</dt>
            <dd className="stat-number">
              ₹{formatNumber(stats.askingRange.low)}–{formatNumber(stats.askingRange.high)} <span className="text-sm font-normal text-muted">{t.perSqFt}</span>
            </dd>
          </div>
        )}
        <div className="flex flex-col-reverse gap-1">
          <dt className="caption-mono">{t.localities}</dt>
          <dd className="stat-number">{stats.localityCount}</dd>
        </div>
      </dl>
      {stats.topLocalities.length > 0 && (
        <div className="mt-5">
          <p className="caption-mono">{labels.topAreas}</p>
          <ol className="mt-2 divide-y divide-line">
            {stats.topLocalities.slice(0, 3).map((l, i) => (
              <li key={l.id} className="flex items-baseline gap-3 py-2 text-[15px]">
                <span aria-hidden="true" className="w-5 font-mono text-[11px] text-accent-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <a href={localePath(locale, `/${city.id}/${l.id}/`)} className="text-ink no-underline hover:text-accent-deep">
                  {pick(locale, l.name, l.nameHi)}
                </a>
                <span className="ml-auto font-mono text-xs text-muted tabular-nums">{l.score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <a href={localePath(locale, `/${city.id}/`)} className="mt-auto pt-6 text-[13.5px] font-semibold text-accent-deep no-underline hover:underline">
        {labels.seeCity}
      </a>
    </article>
  );
}
