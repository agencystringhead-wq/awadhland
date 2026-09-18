import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ui, whatsappText, type Locale } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";

export type MidArticleCtaProps = {
  locale: Locale;
  broker: Pick<TeamMember, "whatsapp">;
  pageLabel: string;
};

/** Spec Template 6, section 4: one-line broker offer with a WhatsApp button, placed by the renderer after the second H2. */
export function MidArticleCta({ locale, broker, pageLabel }: MidArticleCtaProps) {
  const t = ui[locale];
  return (
    <aside
      data-component="MidArticleCta"
      className="card mdx-block my-10 flex flex-col gap-4 bg-accent-soft/60 p-5 md:flex-row md:items-center md:justify-between md:p-6"
    >
      <div>
        <p className="font-semibold">{t.midCtaTitle}</p>
        <p className="mt-1 text-[15px] text-ink-soft">{t.midCtaBody}</p>
      </div>
      <div className="shrink-0">
        <WhatsAppButton number={broker.whatsapp} text={whatsappText(locale, pageLabel)} label={t.talkOnWhatsapp} variant="compact" />
      </div>
    </aside>
  );
}
