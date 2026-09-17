import type { Locale } from "@/lib/i18n";
import { formatDate, formatInr, ui } from "@/lib/i18n";

export type PriceTrendPoint = { date: string; median: number; count: number };

export type PriceTrendProps = {
  locale: Locale;
  series: PriceTrendPoint[];
};

/**
 * Line chart of the median asking rate over time, drawn as inline SVG at build (spec Template 2,
 * section 6). No chart library, no client JS. With fewer than two points it renders the latest
 * value as a stat instead of a line.
 */
export function PriceTrend({ locale, series }: PriceTrendProps) {
  if (series.length === 0) return null;
  const t = ui[locale];
  const latest = series[series.length - 1];

  if (series.length < 2) {
    return (
      <div data-component="PriceTrend" className="card p-5">
        <p className="text-sm text-muted">
          {t.medianAsking} · <time dateTime={latest.date}>{formatDate(latest.date, locale)}</time>
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {formatInr(latest.median)} <span className="text-base font-normal text-muted">{t.perSqFt}</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {latest.count} {t.observations}
        </p>
      </div>
    );
  }

  const W = 640;
  const H = 240;
  const pad = { top: 16, right: 16, bottom: 32, left: 56 };
  const xs = series.map((_, i) => pad.left + (i * (W - pad.left - pad.right)) / (series.length - 1));
  const min = Math.min(...series.map((p) => p.median));
  const max = Math.max(...series.map((p) => p.median));
  const span = max - min || max || 1;
  const y = (v: number) => pad.top + ((max - v) / span) * (H - pad.top - pad.bottom);
  const path = series.map((p, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${y(p.median).toFixed(1)}`).join(" ");
  const ticks = [max, (max + min) / 2, min];

  return (
    <figure data-component="PriceTrend" className="card p-5">
      <figcaption className="text-sm text-muted">
        {t.medianAsking}, ₹ {t.perSqFt}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.priceTrend} className="mt-2 h-auto w-full">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="#e2d9c8" strokeWidth={1} />
            <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="#7a736a">
              {formatInr(Math.round(v))}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#1f4d3a" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {series.map((p, i) => (
          <g key={p.date}>
            <circle cx={xs[i]} cy={y(p.median)} r={4} fill="#1f4d3a" stroke="#fffdf9" strokeWidth={2} />
            <text x={xs[i]} y={H - 10} textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"} fontSize={12} fill="#7a736a">
              {formatDate(p.date, locale)}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
