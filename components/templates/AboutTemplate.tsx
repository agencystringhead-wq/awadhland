import { Badges } from "@/components/Badges";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BrokerCard } from "@/components/BrokerCard";
import { HowWeWork, howWeWorkCopy } from "@/components/HowWeWork";
import { LeadForm } from "@/components/LeadForm";
import { Reviews } from "@/components/Reviews";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { TrustBar } from "@/components/TrustBar";
import { WhyWeExist, whyWeExistCopy } from "@/components/WhyWeExist";
import { getBroker, getCities } from "@/lib/data";
import { localePath, ui, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/** Template 9 About page. The six trust components fed from team.json; story, checklist and photos come with the standard pages. */
export function AboutTemplate({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const broker = getBroker();
  const cities = getCities();
  const pageLabel = t.about;
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/about/")} pageLabel={pageLabel}>
      <div className="container-site">
        <Breadcrumb items={[{ label: t.home, href: localePath(locale, "/") }, { label: t.about }]} />
        <h1>{t.about}</h1>
        <div className="mt-4">
          <TrustBar locale={locale} broker={broker} />
        </div>
      </div>
      <Section>
        <div className="max-w-2xl">
          <BrokerCard locale={locale} broker={broker} areas={cities} pageLabel={pageLabel} />
        </div>
      </Section>
      <Section>
        <WhyWeExist locale={locale} {...whyWeExistCopy[locale]} />
      </Section>
      <Section>
        <HowWeWork locale={locale} {...howWeWorkCopy[locale]} />
      </Section>
      <Section>
        <Reviews locale={locale} reviews={[]} />
        <Badges locale={locale} broker={broker} citiesCovered={cities.length} />
      </Section>
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} />
        <SourceStamp locale={locale} sources={broker.sources} updatedAt={broker.updatedAt} />
      </Section>
    </PageShell>
  );
}
