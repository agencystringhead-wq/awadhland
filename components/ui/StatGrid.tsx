export type Stat = { value: string; label: string; href?: string };

export type StatGridProps = {
  stats: Stat[];
  /** cells per row on desktop; wraps to 4 then 2 on smaller screens */
  columns?: 6 | 8;
};

/**
 * "By the numbers" band (reference §8 stat cell): number in 22px serif over a 10px mono caption,
 * 1px rules between cells, gradient paper→vellum band with hairlines top and bottom.
 */
export function StatGrid({ stats, columns = 8 }: StatGridProps) {
  const cols = columns === 8 ? "lg:grid-cols-8" : "lg:grid-cols-6";
  return (
    <div data-component="StatGrid" className="hairline border-b border-line bg-[linear-gradient(var(--color-cream),var(--color-card))]">
      <dl className={`container-site grid grid-cols-2 gap-y-6 py-6 sm:grid-cols-4 ${cols}`}>
        {stats.map((s, i) => (
          <div key={s.label} className={`flex flex-col-reverse gap-1 px-4 lg:px-6 ${i > 0 ? "sm:border-l sm:border-line" : ""}`}>
            <dt className="caption-mono">{s.label}</dt>
            <dd className="stat-number text-ink">{s.href ? <a href={s.href} className="text-ink no-underline hover:text-accent">{s.value}</a> : s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
