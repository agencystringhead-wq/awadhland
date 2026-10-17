import { FAQ } from "@/components/FAQ";
import { formatPhone } from "@/components/Hero";
import { Section } from "@/components/Section";
import { whatsappHref } from "@/components/WhatsAppButton";
import { aboutEntityCopy, entityDescription, fillCopy } from "@/lib/entity";
import { localePath, pick, whatsappText, type Locale } from "@/lib/i18n";
import { navCopy } from "@/lib/nav";
import type { City, TeamMember } from "@/lib/schemas";

/**
 * The About page's entity block: the one-sentence definition first (the sentence search engines and
 * AI assistants lift), then what we do, the cities, who we help, how to reach us and a short FAQ.
 * The FAQ renders its own FAQPage JSON-LD. Text lives in lib/entity.ts.
 */
export function AboutEntity({ locale, broker, cities }: { locale: Locale; broker: Pick<TeamMember, "phone" | "whatsapp" | "email">; cities: Pick<City, "id" | "name" | "nameHi">[] }) {
  const c = aboutEntityCopy[locale];
  const vars = { phone: formatPhone(broker.phone), email: broker.email, hours: navCopy[locale].strip.hours, definition: entityDescription[locale] };
  const h2 = "text-xl";
  return (
    <>
      <Section>
        <p data-component="EntityDefinition" className="lede max-w-3xl">
          {entityDescription[locale]}
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className={h2}>{c.whatWeDoTitle}</h2>
            <p className="mt-3 max-w-prose text-ink-soft">{c.whatWeDo}</p>
          </div>
          <div>
            <h2 className={h2}>{c.whoTitle}</h2>
            <p className="mt-3 max-w-prose text-ink-soft">{c.who}</p>
          </div>
          <div>
            <h2 className={h2}>{c.citiesTitle}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {cities.map((city) => (
                <li key={city.id}>
                  <a href={localePath(locale, `/${city.id}/`)} className="chip border border-line bg-card no-underline hover:border-accent">
                    {pick(locale, city.name, city.nameHi)}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">{c.citiesNote}</p>
          </div>
          <div>
            <h2 className={h2}>{c.contactTitle}</h2>
            <p className="mt-3 text-ink-soft">
              <a href={`tel:${broker.phone}`} className="font-medium tabular-nums">
                {vars.phone}
              </a>
              {" · "}
              <a href={whatsappHref(broker.whatsapp, whatsappText(locale, "AwadhLand"))} rel="noopener noreferrer" target="_blank">
                WhatsApp
              </a>
              {" · "}
              <a href={`mailto:${broker.email}`}>{broker.email}</a>
            </p>
            <p className="mt-2 text-sm text-muted">{fillCopy(c.hours, vars)}</p>
          </div>
        </div>
      </Section>
      <Section>
        <FAQ title={c.faqTitle} items={c.faq.map((f) => ({ q: f.q, a: fillCopy(f.a, vars) }))} />
      </Section>
    </>
  );
}
