import type { Locale } from "@/lib/i18n";
import { ui } from "@/lib/i18n";
import type { City, TeamMember } from "@/lib/schemas";
import { WhatsAppButton } from "./WhatsAppButton";

export type BrokerCardProps = {
  locale: Locale;
  broker: Pick<TeamMember, "name" | "nameHi" | "role" | "reraNumber" | "reraUrl" | "yearsActive" | "phone" | "whatsapp" | "photo">;
  /** Areas covered; not in team.json yet, passed from cities.json */
  areas: Pick<City, "id" | "name" | "nameHi">[];
  /** Shown only when 4.5 or higher (spec Template 9) */
  googleRating?: number;
};

/** Stub. Photo, name in both scripts, RERA link, years active, areas, WhatsApp and call. */
export function BrokerCard({ locale, broker, areas, googleRating }: BrokerCardProps) {
  const t = ui[locale];
  return (
    <section data-component="BrokerCard">
      {/* Plain img on purpose: media is pre-encoded WebP on R2 (CLAUDE.md), and next/image adds client JS to every page using it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={broker.photo} alt={locale === "hi" ? broker.nameHi : broker.name} width={160} height={160} />
      <p>{broker.name}</p>
      <p lang="hi">{broker.nameHi}</p>
      <p>{broker.role}</p>
      {broker.reraNumber && (broker.reraUrl ? <a href={broker.reraUrl}>{broker.reraNumber}</a> : <p>{broker.reraNumber}</p>)}
      <p>{broker.yearsActive}</p>
      <ul>
        {areas.map((a) => (
          <li key={a.id}>{locale === "hi" ? a.nameHi : a.name}</li>
        ))}
      </ul>
      {googleRating !== undefined && googleRating >= 4.5 && <p>Google {googleRating}</p>}
      <WhatsAppButton number={broker.whatsapp} text="" label={t.whatsapp} />
      <a href={`tel:${broker.phone}`}>{t.call}</a>
    </section>
  );
}
