import { Badges } from "@/components/Badges";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BrokerCard } from "@/components/BrokerCard";
import { HowWeWork, howWeWorkCopy } from "@/components/HowWeWork";
import { Reviews } from "@/components/Reviews";
import { SourceStamp } from "@/components/SourceStamp";
import { TrustBar } from "@/components/TrustBar";
import { WhyWeExist, whyWeExistCopy } from "@/components/WhyWeExist";
import { getBroker, getCities } from "@/lib/data";
import { localePath, ui, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { DataDump, PageShell } from "./PageShell";

/** Template 9 About page. Scaffold: the six trust components fed from team.json. */
export function AboutTemplate({ locale }: { locale: Locale }) {
  const broker = getBroker();
  const cities = getCities();
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/about/")}>
      <Breadcrumb items={[{ label: ui[locale].home, href: localePath(locale, "/") }, { label: ui[locale].about }]} />
      <h1>{ui[locale].about}</h1>
      <TrustBar locale={locale} broker={broker} />
      <BrokerCard locale={locale} broker={broker} areas={cities} />
      <WhyWeExist locale={locale} {...whyWeExistCopy[locale]} />
      <HowWeWork locale={locale} steps={howWeWorkCopy[locale].steps} feeNote={howWeWorkCopy[locale].feeNote} />
      <Reviews locale={locale} reviews={[]} />
      <Badges locale={locale} broker={broker} citiesCovered={cities.length} />
      <DataDump data={broker} />
      <SourceStamp locale={locale} sources={broker.sources} updatedAt={broker.updatedAt} />
    </PageShell>
  );
}
