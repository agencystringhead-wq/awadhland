import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { getStandardPage } from "@/lib/data";
import { localePath, pick, ui, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/**
 * Standard pages whose copy is data (data/standardPages.json): a lede, a run of headed sections,
 * and the source stamp every data page carries.
 *
 * Both languages sit side by side in the record rather than one being generated from the other,
 * so the Hindi reads as Hindi. Body size follows the design reference: 17px English, 18px Hindi.
 */
export function StandardPageTemplate({ locale, id }: { locale: Locale; id: string }) {
  const page = getStandardPage(id);
  if (!page) notFound();
  const t = ui[locale];
  const title = pick(locale, page.title, page.titleHi);
  const body = locale === "hi" ? "text-[18px]" : "text-[17px]";

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, page.sitePath)} pageLabel={title} sitePath={page.sitePath}>
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb items={[{ label: t.home, href: localePath(locale, "/") }, { label: title }]} />
          <h1 className="max-w-3xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">{pick(locale, page.lede, page.ledeHi)}</p>
        </div>
      </section>

      <Section>
        <div className="max-w-3xl">
          {page.sections.map((s) => (
            <section key={s.heading} className="mt-10 first:mt-0">
              <h2 className="h-sub">{pick(locale, s.heading, s.headingHi)}</h2>
              <div className={`prose-site mt-3 ${body} leading-relaxed`}>
                {(locale === "hi" ? s.bodyHi : s.body).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}
          <SourceStamp locale={locale} sources={page.sources} updatedAt={page.updatedAt} />
        </div>
      </Section>
    </PageShell>
  );
}
