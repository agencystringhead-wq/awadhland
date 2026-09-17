import type { Locale } from "@/lib/i18n";
import { ui, whatsappText } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";
import { WhatsAppButton } from "./WhatsAppButton";

export type LeadFormProps = {
  locale: Locale;
  broker: Pick<TeamMember, "phone" | "whatsapp">;
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
 * Lead capture block. The JotForm embed via Cloudflare Worker arrives in build step 7 and will read
 * the data-* prefill attributes; until then the block offers WhatsApp and call so no lead is lost.
 * No third-party script loads here.
 */
export function LeadForm({ locale, broker, pageLabel, city, locality, context }: LeadFormProps) {
  const t = ui[locale];
  return (
    <section
      id="lead-form"
      data-component="LeadForm"
      data-locale={locale}
      data-city={city}
      data-locality={locality}
      data-context={context}
      className="card bg-accent-soft/60 p-6 md:p-8"
    >
      <h2>{t.leadForm}</h2>
      <p className="mt-2 max-w-prose text-ink-soft">{t.leadFormNote}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <WhatsAppButton number={broker.whatsapp} text={whatsappText(locale, pageLabel)} label={t.talkOnWhatsapp} />
        <a
          href={`tel:${broker.phone}`}
          className="btn border border-accent bg-card text-accent-deep hover:bg-accent hover:text-white text-base px-6 py-3"
        >
          {t.call}
        </a>
      </div>
    </section>
  );
}
