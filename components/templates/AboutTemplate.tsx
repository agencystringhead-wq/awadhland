import { Badges } from "@/components/Badges";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BrokerCard } from "@/components/BrokerCard";
import { HowWeWork, hasHowWeWorkCopy, howWeWorkCopy } from "@/components/HowWeWork";
import { LeadForm } from "@/components/LeadForm";
import { Reviews } from "@/components/Reviews";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { TrustBar } from "@/components/TrustBar";
import { WhyWeExist, hasWhyWeExistCopy, whyWeExistCopy } from "@/components/WhyWeExist";
import { JsonLd } from "@/components/JsonLd";
import { homeStory } from "@/lib/content";
import { person } from "@/lib/jsonld";
import { getBroker, getCities, getReviews } from "@/lib/data";
import { localePath, pick, ui, type Locale } from "@/lib/i18n";
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
      <JsonLd data={person(broker, locale, getReviews())} />
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
      {/* The broker's own bio (spec Template 9: the About page goes deeper than the homepage).
          Nothing rendered team.json's bio before this, so the field was written and never read. */}
      <Section title={t.inOwnWords}>
        <div className={`prose-site max-w-2xl ${locale === "hi" ? "text-[18px]" : "text-[17px]"} leading-relaxed`}>
          {pick(locale, broker.bio, broker.bioHi)
            .split(/\n\s*\n/)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
        </div>
      </Section>
      {hasWhyWeExistCopy(whyWeExistCopy[locale]) && (
        <Section>
          <WhyWeExist locale={locale} {...whyWeExistCopy[locale]} />
        </Section>
      )}
      {hasHowWeWorkCopy(howWeWorkCopy[locale]) && (
        <Section id="how-we-work">
          <HowWeWork locale={locale} {...howWeWorkCopy[locale]} />
        </Section>
      )}
      {/* Badges stay (RERA number, years, cities); the review block appears once the profile has
          real ones. */}
      <Section id="reviews">
        <Reviews locale={locale} data={getReviews()} labels={homeStory[locale].reviews} />
        <Badges locale={locale} broker={broker} citiesCovered={cities.length} />
      </Section>
      <Section>
        <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} />
        <SourceStamp locale={locale} sources={broker.sources} updatedAt={broker.updatedAt} />
      </Section>
    </PageShell>
  );
}
