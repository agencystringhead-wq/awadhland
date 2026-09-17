import type { Locale } from "@/lib/i18n";

export type LeadFormProps = {
  locale: Locale;
  /** city id for prefill */
  city?: string;
  /** locality id for prefill */
  locality?: string;
  /** free-text context, e.g. "interested near ayodhya-airport-expansion" */
  context?: string;
};

/** Stub. JotForm embed via Cloudflare Worker arrives in build step 7; no third-party script loads here. */
export function LeadForm({ locale, city, locality, context }: LeadFormProps) {
  return (
    <section data-component="LeadForm" data-locale={locale} data-city={city} data-locality={locality} data-context={context}>
      <p>Lead form placeholder</p>
    </section>
  );
}
