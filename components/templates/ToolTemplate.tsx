import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FAQ } from "@/components/FAQ";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { CircleRateLookup } from "@/components/CircleRateLookup";
import { KhasraFrontageCheck } from "@/components/KhasraFrontageCheck";
import { StampDutyCalculator } from "@/components/StampDutyCalculator";
import { toolCopy } from "@/lib/content";
import { fc } from "@/lib/frontage-copy";
import { getBroker, getCity } from "@/lib/data";
import { getCitiesWithRateList, getUnits } from "@/lib/rates";
import { localePath, ui, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { frontageCheckData, isToolSlug, stampDutyCalculatorData } from "@/lib/tools";
import { PageShell } from "./PageShell";

/**
 * Template 7: tool page. The tool at the top, a 400–800 word explainer under it, an FAQ block and
 * the lead CTA. Each tool's interactive part is a client component fed with prerendered data;
 * with JavaScript off the shell shows the explainer and a link to the data page.
 */
export function ToolTemplate({ locale, slug }: { locale: Locale; slug: string }) {
  if (!isToolSlug(slug)) notFound();
  const t = ui[locale];
  const copy = toolCopy[locale][slug];
  const broker = getBroker();
  const pageLabel = copy.title;

  const tool = (() => {
    switch (slug) {
      case "stamp-duty-calculator":
        return <StampDutyCalculator locale={locale} data={stampDutyCalculatorData(locale)} whatsapp={broker.whatsapp} title={t.stampDuty} />;
      case "circle-rate-lookup": {
        // The bigha factor comes from data/units.json on the server: the client must not import
        // lib/units, which reaches lib/rates and would bundle every rate list into this page.
        const { bigha } = getUnits();
        return (
          <CircleRateLookup
            locale={locale}
            whatsapp={broker.whatsapp}
            bighaSqm={bigha.sqm}
            bighaLabel={locale === "hi" ? bigha.labelHi : bigha.label}
            hubs={getCitiesWithRateList().map((id) => {
              const c = getCity(id)!;
              return { id, name: locale === "hi" ? c.nameHi : c.name, href: localePath(locale, `/${id}/circle-rates/`) };
            })}
            plotCheckHref={localePath(locale, "/tools/khasra-frontage-check/")}
          />
        );
      }
      case "khasra-frontage-check":
        return <KhasraFrontageCheck locale={locale} data={frontageCheckData(locale)} whatsapp={broker.whatsapp} title={fc(locale).checkTitle} />;
    }
  })();

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, `/tools/${slug}/`)} pageLabel={pageLabel}>
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb items={[{ label: t.home, href: localePath(locale, "/") }, { label: t.tools, href: `${localePath(locale, "/")}#tools` }, { label: copy.title }]} />
          <h1 className="max-w-3xl">{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">{copy.intro}</p>
        </div>
      </section>

      {/* The tool */}
      <Section>{tool}</Section>

      {/* Explainer */}
      <Section title={t.howThisToolWorks}>
        <div className="prose-site max-w-3xl text-[17px] leading-relaxed">
          {copy.explainer.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <FAQ title={t.faq} items={copy.faq} />
      </Section>

      {/* CTA */}
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} context={`tool:${slug}`} />
      </Section>
    </PageShell>
  );
}
