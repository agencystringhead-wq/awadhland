import { fill, homeStory } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import { ui, whatsappText } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";
import { EnquiryForm } from "./EnquiryForm";
import { formatPhone } from "./Hero";
import { Button, PhoneIcon, WhatsAppIcon } from "./ui/Button";
import { whatsappHref } from "./WhatsAppButton";

export type LeadFormProps = {
  locale: Locale;
  broker: Pick<TeamMember, "phone" | "whatsapp" | "yearsActive">;
  /** Human page name for the WhatsApp prefill */
  pageLabel: string;
  /** city id for prefill */
  city?: string;
  /** locality id for prefill */
  locality?: string;
  /** free-text context, e.g. "interested near ayodhya-airport-expansion" */
  context?: string;
};

/**
 * Lead capture block on every data page (spec "Shared components"): heading, the full enquiry
 * form prefilled with city, locality and context, and WhatsApp + Call beside it for anyone who
 * would rather not type. Submissions go through the Worker to JotForm; no third-party script.
 */
export function LeadForm({ locale, broker, pageLabel, city, locality, context }: LeadFormProps) {
  const t = ui[locale];
  const story = homeStory[locale];
  const vars = { years: broker.yearsActive, phone: formatPhone(broker.phone) };
  return (
    <section id="lead-form" data-component="LeadForm" className="card-raised p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12">
        <div>
          <h2>{t.leadForm}</h2>
          <p className="mt-3 max-w-prose text-ink-soft">{t.leadFormNote}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button href={whatsappHref(broker.whatsapp, whatsappText(locale, pageLabel))} variant="primary" size="sm" icon={<WhatsAppIcon />}>
              {t.talkOnWhatsapp}
            </Button>
            <Button href={`tel:${broker.phone}`} variant="soft" size="sm" icon={<PhoneIcon />}>
              {t.call}
            </Button>
          </div>
        </div>
        <EnquiryForm
          locale={locale}
          variant="band"
          copy={story.form}
          whatsapp={broker.whatsapp}
          phoneDisplay={formatPhone(broker.phone)}
          trust={story.form.trust.map((s) => fill(s, vars))}
          city={city}
          locality={locality}
          context={context}
        />
      </div>
    </section>
  );
}
