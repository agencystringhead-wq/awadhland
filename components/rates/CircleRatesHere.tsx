/**
 * The rows of the published list that cover one locality (spec Template 3, section 2 replacement;
 * Step 9 C4).
 *
 * A locality is rarely one row. Devkali is three rows on the Sadar list, Ranopali is two. So this
 * replaces the single circle-rate figure with every row that applies, each linking to its own
 * village page and naming the printed page it came from, rather than silently picking one.
 */
import { formatNumber, localePath, pick, type Locale } from "@/lib/i18n";
import { rc } from "@/lib/rate-copy";
import { getRateRow, getRateRowWithSchedule, getTehsil } from "@/lib/rates";
import { categoryLabel } from "@/lib/valuation";
import type { Locality } from "@/lib/schemas";

const th = "px-3 py-2.5 text-left font-semibold whitespace-nowrap";
const td = "px-3 py-2 border-t border-line";
const numeric = "text-right tabular-nums";

export function CircleRatesHere({ locale, locality }: { locale: Locale; locality: Locality }) {
  const refs = locality.rateRefs ?? [];
  if (refs.length === 0) return null;
  const rows = refs.flatMap((r) => {
    const row = getRateRow(r.rateRowId);
    return row ? [row] : [];
  });
  if (rows.length === 0) return null;

  const c = rc(locale);
  const schedule = getRateRowWithSchedule(rows[0].id)?.schedule;

  return (
    <div data-component="CircleRatesHere">
      <p className="lede mb-5 max-w-2xl">{c.circleRatesHereLede}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead className="bg-cream-deep">
            <tr>
              <th scope="col" className={th}>
                {c.village}
              </th>
              <th scope="col" className={th}>
                {c.category}
              </th>
              <th scope="col" className={`${th} ${numeric}`} colSpan={3}>
                {c.landRates} · {c.perSqM}
              </th>
              <th scope="col" className={`${th} ${numeric}`}>
                {c.viewCommercial}
              </th>
              <th scope="col" className={`${th} ${numeric}`}>
                {c.agriRates}
              </th>
              <th scope="col" className={th}>
                {c.printedPage}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tehsil = getTehsil(locality.cityId, r.sro);
              return (
                <tr key={r.id}>
                  <td className={td}>
                    <a href={localePath(locale, `/${locality.cityId}/circle-rates/${r.sro}/${r.slug}/`)}>
                      {pick(locale, r.nameEn, r.nameHi)}
                    </a>
                    <span className="block text-xs text-muted">
                      {pick(locale, r.nameHi, r.nameEn)}
                      {tehsil ? ` · ${pick(locale, tehsil.name, tehsil.nameHi)}` : ""}
                    </span>
                  </td>
                  <td className={td}>{categoryLabel[r.category][locale]}</td>
                  <td className={`${td} ${numeric}`}>{formatNumber(r.nonAgri.lt9m)}</td>
                  <td className={`${td} ${numeric}`}>{formatNumber(r.nonAgri.m9to18)}</td>
                  <td className={`${td} ${numeric}`}>{formatNumber(r.nonAgri.ge18m)}</td>
                  <td className={`${td} ${numeric}`}>{formatNumber(r.commercial.shop)}</td>
                  <td className={`${td} ${numeric}`}>{r.agriLakhPerHa.general === null ? "—" : formatNumber(r.agriLakhPerHa.general)}</td>
                  <td className={`${td} text-muted`}>{r.page}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {schedule && (
        <p className="mt-3 text-xs text-muted">
          {locale === "hi"
            ? `कृषि दर ₹ लाख प्रति हेक्टेयर में, जैसी छपी है। खाली सेल का मतलब सूची उस पंक्ति के लिए कृषि दर नहीं छापती।`
            : `Agricultural in ₹ lakh per hectare, as published. A dash means the list prints no agricultural rate for that row.`}
        </p>
      )}
    </div>
  );
}
