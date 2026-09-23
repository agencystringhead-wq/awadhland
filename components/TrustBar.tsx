import type { Locale } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";

export type TrustBarProps = {
  locale: Locale;
  broker: Pick<TeamMember, "yearsActive" | "reraNumber" | "reraUrl">;
};

/** One line under the header on homepage and city hubs (spec Template 9). Hindi line is a person's job. */
export function TrustBar({ locale, broker }: TrustBarProps) {
  // The registration claim rides on the number: lib/guards.ts withholds reraNumber while it is a
  // placeholder, and asserting "UP RERA registered" in words would make the same claim anyway.
  const rera = Boolean(broker.reraNumber);
  const items =
    locale === "hi"
      ? [...(rera ? ["यूपी रेरा पंजीकृत"] : []), `${broker.yearsActive} वर्ष अयोध्या में`, "व्हाट्सऐप पर असली व्यक्ति", "हर रेट का स्रोत"]
      : [...(rera ? ["UP RERA registered"] : []), `${broker.yearsActive} years in Ayodhya`, "Real person on WhatsApp", "Every rate sourced"];
  return (
    <p data-component="TrustBar" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-3">
          {i > 0 && (
            <span aria-hidden="true" className="text-line">
              ·
            </span>
          )}
          {i === 0 && rera && broker.reraUrl ? (
            <a href={broker.reraUrl} rel="noopener" className="font-medium">
              {item}
            </a>
          ) : (
            item
          )}
        </span>
      ))}
    </p>
  );
}
