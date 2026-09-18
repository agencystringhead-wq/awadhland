import type { Locale } from "@/lib/i18n";
import { pick, ui, whatsappText } from "@/lib/i18n";
import type { NavItem, NavLink, NavPanel } from "@/lib/nav";
import { Button, PhoneIcon, WhatsAppIcon } from "./ui/Button";
import { whatsappHref } from "./WhatsAppButton";

export type MegaPanelProps = {
  locale: Locale;
  item: NavItem;
  /** "panel": desktop dropdown, four columns with hairlines. "stack": mobile accordion body. */
  layout: "panel" | "stack";
};

const toolIcons: Record<string, React.ReactNode> = {
  "stamp-duty-calculator": <path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 7h6M9 11h2m4 0h0M9 15h2m4 0h0M9 18h6" />,
  "circle-rate-lookup": <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm5 12 4 4M8 11h6" />,
  "land-safety-checklist": <path d="M5 4h14v16H5zM8 9l1.5 1.5L12 8M8 14l1.5 1.5L12 13M14 9h3M14 14h3" />,
  "plot-yield-calculator": <path d="M4 19h16M6 16l4-5 3 3 5-7" />,
};

function LinkRow({ link }: { link: NavLink }) {
  return (
    <li>
      <a href={link.href} className="group flex items-baseline justify-between gap-3 py-[7px] text-[14px] leading-[1.35] text-ink-soft no-underline hover:text-accent-deep">
        <span className="min-w-0">
          {link.label}
          {link.meta && <span className="ml-2 caption-mono text-[9.5px] normal-case tracking-[0.06em] text-faint">{link.meta}</span>}
        </span>
        {link.chip && <span className="chip shrink-0 px-2 py-0 font-mono text-[10px] text-accent-deep">{link.chip}</span>}
      </a>
    </li>
  );
}

function Columns({ panel, layout }: { panel: Extract<NavPanel, { kind: "columns" }>; layout: "panel" | "stack" }) {
  const cols = panel.columns.length + (panel.image ? 1 : 0);
  return (
    <div className={layout === "panel" ? `grid gap-0 ${cols === 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2"}` : "grid gap-6"}>
      {panel.columns.map((col, i) => (
        <section key={col.title} className={layout === "panel" ? `${i > 0 ? "border-l border-line pl-7" : ""} ${i < panel.columns.length - 1 || panel.image ? "pr-7" : ""}` : ""}>
          <h3 className="caption-mono mb-2 text-ink">{col.title}</h3>
          <ul className="divide-y divide-line/60">
            {col.links.map((l) => (
              <LinkRow key={l.href + l.label} link={l} />
            ))}
          </ul>
          {col.more && (
            <a href={col.more.href} className="mt-3 inline-block text-[13.5px] font-semibold text-accent-deep no-underline hover:underline">
              {col.more.label}
            </a>
          )}
        </section>
      ))}
      {panel.image && (
        <a href={panel.image.href} className={`block overflow-hidden rounded-[14px] border border-line bg-cream-deep no-underline ${layout === "panel" ? "ml-7" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={panel.image.src} alt={panel.image.alt} width={1200} height={800} loading="lazy" className="aspect-[3/2] h-auto w-full object-cover" />
          <span className="block border-t border-line bg-card px-3.5 py-2.5 text-[12px] leading-[1.4] text-ink-soft">{panel.image.caption}</span>
        </a>
      )}
    </div>
  );
}

function Tools({ panel, layout }: { panel: Extract<NavPanel, { kind: "tools" }>; layout: "panel" | "stack" }) {
  return (
    <ul className={layout === "panel" ? "grid grid-cols-4 gap-4" : "grid gap-3"}>
      {panel.tools.map((t) => (
        <li key={t.slug} className="card flex flex-col p-5">
          <span aria-hidden="true" className="mb-3 grid size-10 place-items-center rounded-[10px] bg-accent-soft text-accent-deep">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {toolIcons[t.slug]}
            </svg>
          </span>
          <h3 className="text-[18px]">
            <a href={t.href} className="text-ink no-underline hover:text-accent-deep">
              {t.title}
            </a>
          </h3>
          <p className="mt-1.5 text-[13.5px] leading-[1.45] text-ink-soft">{t.body}</p>
          <a href={t.href} className="mt-auto pt-3 text-[13px] font-semibold text-accent-deep no-underline hover:underline">
            {panel.more}
          </a>
        </li>
      ))}
    </ul>
  );
}

function About({ panel, locale, layout }: { panel: Extract<NavPanel, { kind: "about" }>; locale: Locale; layout: "panel" | "stack" }) {
  const t = ui[locale];
  const b = panel.broker;
  return (
    <div className={layout === "panel" ? "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-0" : "grid gap-5"}>
      <div className={`flex items-start gap-4 ${layout === "panel" ? "pr-7" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.photo} alt="" width={72} height={72} loading="lazy" className="size-[72px] shrink-0 rounded-[12px] bg-cream-deep object-cover object-top" />
        <div className="min-w-0">
          <p className="caption-mono">{t.yourBroker}</p>
          <p className="font-display text-[20px] font-medium leading-tight text-ink">{pick(locale, b.name, b.nameHi)}</p>
          <p lang={locale === "hi" ? "en" : "hi"} className="text-sm text-muted">
            {pick(locale, b.nameHi, b.name)}
          </p>
          <p className="caption-mono mt-1 text-[9.5px]">UP RERA {b.reraNumber ?? "TODO"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button href={whatsappHref(b.whatsapp, whatsappText(locale, t.about))} variant="primary" size="sm" icon={<WhatsAppIcon />}>
              {t.whatsapp}
            </Button>
            <Button href={`tel:${b.phone}`} variant="soft" size="sm" icon={<PhoneIcon />}>
              {t.call}
            </Button>
          </div>
        </div>
      </div>
      <ul className={`divide-y divide-line/60 ${layout === "panel" ? "border-l border-line pl-7" : ""}`}>
        {panel.links.map((l) => (
          <LinkRow key={l.href} link={l} />
        ))}
      </ul>
    </div>
  );
}

/** One mega panel's content. The Header decides how it opens; this only renders. */
export function MegaPanel({ locale, item, layout }: MegaPanelProps) {
  const { panel } = item;
  return (
    <div data-component="MegaPanel" data-nav={item.key}>
      {panel.kind === "columns" && <Columns panel={panel} layout={layout} />}
      {panel.kind === "tools" && <Tools panel={panel} layout={layout} />}
      {panel.kind === "about" && <About panel={panel} locale={locale} layout={layout} />}
    </div>
  );
}
