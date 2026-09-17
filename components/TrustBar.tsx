import type { Locale } from "@/lib/i18n";
import type { TeamMember } from "@/lib/schemas";

export type TrustBarProps = {
  locale: Locale;
  broker: Pick<TeamMember, "yearsActive" | "reraNumber">;
};

/** Stub. One line under the header on homepage and city hubs. Hindi line to be written by a person. */
export function TrustBar({ locale, broker }: TrustBarProps) {
  const items =
    locale === "hi"
      ? ["TODO: हिंदी ट्रस्ट लाइन किसी व्यक्ति द्वारा लिखी जाए", `${broker.yearsActive} वर्ष`]
      : [
          "UP RERA registered",
          `${broker.yearsActive} years in Ayodhya`,
          "Real person on WhatsApp",
          "Every rate sourced",
        ];
  return (
    <p data-component="TrustBar" data-rera={broker.reraNumber ?? undefined}>
      {items.join(" · ")}
    </p>
  );
}
