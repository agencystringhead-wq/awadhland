import type { Locale } from "@/lib/i18n";
import { ui, whatsappText } from "@/lib/i18n";
import type { City, TeamMember } from "@/lib/schemas";
import { WhatsAppButton } from "./WhatsAppButton";

export type BrokerCardProps = {
  locale: Locale;
  broker: Pick<TeamMember, "name" | "nameHi" | "role" | "reraNumber" | "reraUrl" | "yearsActive" | "phone" | "whatsapp" | "photo">;
  /** Areas covered; not in team.json yet, passed from cities.json */
  areas: Pick<City, "id" | "name" | "nameHi">[];
  /** Shown only when 4.5 or higher (spec Template 9) */
  googleRating?: number;
  pageLabel: string;
};

/** Photo, name in both scripts, RERA number linked to the UPRERA record, years, areas, WhatsApp and call. */
export function BrokerCard({ locale, broker, areas, googleRating, pageLabel }: BrokerCardProps) {
  const t = ui[locale];
  const primaryName = locale === "hi" ? broker.nameHi : broker.name;
  const secondaryName = locale === "hi" ? broker.name : broker.nameHi;
  return (
    <section data-component="BrokerCard" className="card p-5 md:p-6">
      <p className="text-sm font-semibold text-accent">{t.yourBroker}</p>
      <div className="mt-3 flex items-start gap-4">
        {/* Plain img on purpose: media is pre-encoded WebP on R2 (CLAUDE.md), and next/image adds client JS. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={broker.photo} alt={primaryName} width={96} height={96} className="size-24 shrink-0 rounded-card bg-cream-deep object-cover" />
        <div className="min-w-0">
          <h3 className="text-xl">{primaryName}</h3>
          <p lang={locale === "hi" ? "en" : "hi"} className="text-ink-soft">
            {secondaryName}
          </p>
          <p className="mt-2 text-[15px]">
            {t.reraRegistered} · {broker.yearsActive} {t.yearsInAyodhya}
          </p>
          {broker.reraNumber && (
            <p className="text-[15px]">
              RERA:{" "}
              {broker.reraUrl ? (
                <a href={broker.reraUrl} rel="noopener">
                  {broker.reraNumber}
                </a>
              ) : (
                broker.reraNumber
              )}
            </p>
          )}
          {googleRating !== undefined && googleRating >= 4.5 && <p className="text-[15px]">Google ★ {googleRating}</p>}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">
        {t.areasCovered}: {areas.map((a) => (locale === "hi" ? a.nameHi : a.name)).join(" · ")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <WhatsAppButton number={broker.whatsapp} text={whatsappText(locale, pageLabel)} label={t.whatsapp} variant="compact" />
        <a href={`tel:${broker.phone}`} className="btn border border-line bg-card text-ink hover:bg-cream-deep px-3.5 py-2 text-sm">
          {t.call}
        </a>
      </div>
    </section>
  );
}
