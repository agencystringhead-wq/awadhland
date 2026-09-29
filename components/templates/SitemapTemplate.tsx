import { Breadcrumb } from "@/components/Breadcrumb";
import { Section } from "@/components/Section";
import { getCities } from "@/lib/data";
import { localePath, pick, SITE_URL, ui, type Locale } from "@/lib/i18n";
import { getIndexablePages, type PageEntry, type PageKind } from "@/lib/pages";
import { sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/**
 * Human-readable sitemap (spec "Standard pages"). Built from the same page list as the XML
 * sitemaps, so it can never list a page that does not exist or omit one that does. Only
 * indexable pages appear. Village rate pages are left out: there are thousands and they are
 * opened to search in batches (spec Template 5b).
 */
const heads: Record<string, { en: string; hi: string }> = {
  site: { en: "Site", hi: "साइट" },
  project: { en: "Government projects", hi: "सरकारी प्रोजेक्ट" },
  guide: { en: "Guides", hi: "गाइड" },
  tool: { en: "Tools", hi: "टूल्स" },
  update: { en: "Updates", hi: "अपडेट" },
  localities: { en: "Localities", hi: "इलाक़े" },
  rates: { en: "Circle rates", hi: "सर्किल रेट" },
};

function PageList({ pages }: { pages: PageEntry[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      {pages.map((p) => (
        <li key={p.path}>
          <a href={p.path} className="text-ink-soft hover:text-accent-deep">
            {p.og.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function SitemapTemplate({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const pages = getIndexablePages(locale);
  const of = (...kinds: PageKind[]) => pages.filter((p) => kinds.includes(p.kind));
  const h = (key: string) => heads[key][locale];
  const sub = "label-mono mb-3 mt-7";

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/sitemap/")} pageLabel={t.sitemap}>
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb items={[{ label: t.home, href: localePath(locale, "/") }, { label: t.sitemap }]} />
          <h1 className="max-w-3xl">{t.sitemap}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">{t.sitemapLede}</p>
          <p className="mt-3 text-[14px]">
            <a href={`${SITE_URL}/sitemap-index.xml`} className="font-medium text-accent-deep">
              {t.sitemapXml}
            </a>
          </p>
        </div>
      </section>

      <Section title={h("site")}>
        <PageList pages={of("home", "about", "contact", "updates", "standard")} />
      </Section>

      {getCities().map((c) => {
        const inCity = (p: PageEntry) => p.sitePath.startsWith(`/${c.id}/`);
        const city = of("city").filter(inCity);
        const rates = of("circle-rates", "rate-tehsil").filter(inCity);
        const localities = of("locality").filter(inCity);
        if (city.length + rates.length + localities.length === 0) return null;
        return (
          <Section key={c.id} title={pick(locale, c.name, c.nameHi)}>
            <PageList pages={city} />
            {rates.length > 0 && (
              <>
                <p className={sub}>{h("rates")}</p>
                <PageList pages={rates} />
              </>
            )}
            {localities.length > 0 && (
              <>
                <p className={sub}>{h("localities")}</p>
                <PageList pages={localities} />
              </>
            )}
          </Section>
        );
      })}

      {(["project", "guide", "tool", "update"] as const).map((k) => {
        const list = of(k);
        return list.length === 0 ? null : (
          <Section key={k} title={h(k)}>
            <PageList pages={list} />
          </Section>
        );
      })}

    </PageShell>
  );
}
