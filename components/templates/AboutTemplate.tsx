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
import { brokerIsRegistered } from "@/lib/guards";
import { person } from "@/lib/jsonld";
import type { TeamMember } from "@/lib/schemas";
import { getBroker, getCities, getReviews } from "@/lib/data";
import { localePath, pick, ui, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { PageShell } from "./PageShell";

/** The RERA wording follows lib/guards.ts: withheld until team.json carries a number. */
function portraitAlt(locale: Locale, broker: TeamMember): string {
  const registered = brokerIsRegistered(broker);
  return locale === "hi"
    ? `${broker.nameHi}, ${registered ? "UP RERA में पंजीकृत ज़मीन ब्रोकर" : "ज़मीन ब्रोकर"}, AwadhLand`
    : `${broker.name}, ${registered ? "UP RERA-registered land broker" : "land broker"}, AwadhLand`;
}

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
      {/* Heading lives in the text column (not Section's title) so the portrait can top-align with it
          on desktop and sit above both on mobile. */}
      <Section>
        <div className="grid items-start gap-8 lg:grid-cols-[3fr_2fr] lg:gap-12">
          <div>
            <h2 className="mb-8">{t.inOwnWords}</h2>
            <div className={`prose-site max-w-2xl ${locale === "hi" ? "text-[18px]" : "text-[17px]"} leading-relaxed`}>
              {pick(locale, broker.bio, broker.bioHi)
                .split(/\n\s*\n/)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </div>
          {broker.portrait && (
            <picture className="order-first mx-auto block w-full max-w-[280px] lg:order-none lg:mr-0 lg:max-w-[380px]">
              <source srcSet={broker.portrait.src} type="image/webp" />
              {/* Plain img on purpose: media is pre-encoded WebP (CLAUDE.md), and next/image adds client JS. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={broker.portrait.fallback}
                alt={portraitAlt(locale, broker)}
                width={broker.portrait.width}
                height={broker.portrait.height}
                loading="lazy"
                decoding="async"
                className="h-auto w-full rounded-card bg-cream-deep shadow-md"
              />
            </picture>
          )}
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
