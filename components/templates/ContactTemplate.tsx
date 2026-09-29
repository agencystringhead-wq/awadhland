import { Breadcrumb } from "@/components/Breadcrumb";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { SourceStamp } from "@/components/SourceStamp";
import { Button, PhoneIcon, WhatsAppIcon } from "@/components/ui/Button";
import { whatsappHref } from "@/components/WhatsAppButton";
import { getBroker } from "@/lib/data";
import { localePath, pick, ui, whatsappText, type Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { formatPhone } from "@/components/Hero";
import { PageShell } from "./PageShell";

/**
 * Contact page (spec "Standard pages": office address, hours, WhatsApp, call, lead form). Address
 * and email live on the broker record (data/team.json) alongside phone and WhatsApp — this is a
 * one-broker office, so the office's contact channels and the broker's are the same record.
 */
export function ContactTemplate({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const broker = getBroker();
  const pageLabel = t.contact;
  const addr = broker.officeAddress;
  const street = pick(locale, addr.street, addr.streetHi);
  const localityName = pick(locale, addr.locality, addr.localityHi);
  const district = pick(locale, addr.district, addr.districtHi);
  const state = pick(locale, addr.state, addr.stateHi);
  const fullAddress = `${addr.street}, ${addr.locality}, ${addr.district}, ${addr.state}, ${addr.postalCode}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/contact/")} pageLabel={pageLabel}>
      <section className="border-b border-line bg-cream-deep/60">
        <div className="container-site pb-8 md:pb-10">
          <Breadcrumb items={[{ label: t.home, href: localePath(locale, "/") }, { label: pageLabel }]} />
          <h1 className="max-w-3xl">{pageLabel}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">{t.contactLede}</p>
        </div>
      </section>

      <Section>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12">
          <div className="card-raised p-6 md:p-8">
            <p className="label-mono mb-2">{t.address}</p>
            <p className="text-ink-soft">
              {street}
              <br />
              {localityName}, {district}
              <br />
              {state} {addr.postalCode}
            </p>
            <a href={mapsHref} rel="noopener" target="_blank" className="mt-2 inline-block text-[14px] font-medium text-accent-deep">
              {t.getDirections}
            </a>

            <p className="label-mono mb-2 mt-7">{t.officeHours}</p>
            <p className="text-ink-soft">{t.hours}</p>

            <p className="label-mono mb-2 mt-7">{t.email}</p>
            <a href={`mailto:${broker.email}`} className="text-ink-soft hover:text-accent-deep">
              {broker.email}
            </a>

            <div className="mt-7 flex flex-wrap gap-2.5 border-t border-line pt-6">
              <Button href={whatsappHref(broker.whatsapp, whatsappText(locale, pageLabel))} variant="primary" size="sm" icon={<WhatsAppIcon />}>
                {t.talkOnWhatsapp}
              </Button>
              <Button href={`tel:${broker.phone}`} variant="soft" size="sm" icon={<PhoneIcon />}>
                {t.call} <span className="tabular-nums">{formatPhone(broker.phone)}</span>
              </Button>
            </div>
          </div>
          <LeadForm locale={locale} broker={broker} pageLabel={pageLabel} />
        </div>
        <SourceStamp locale={locale} sources={broker.sources} updatedAt={broker.updatedAt} />
      </Section>
    </PageShell>
  );
}
