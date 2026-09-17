import { WhatChanged } from "@/components/WhatChanged";
import {
  getBroker,
  getBuildableLocalities,
  getCircleRateSchedules,
  getCities,
  getProjects,
  getUpdates,
} from "@/lib/data";
import { getGuides } from "@/lib/guides";
import type { Locale } from "@/lib/i18n";
import { sameAlternate } from "@/lib/routes";
import { DataDump, PageShell } from "./PageShell";

/** Template 1. Scaffold: title, hero counters and seed data as JSON. */
export function HomeTemplate({ locale }: { locale: Locale }) {
  const updates = getUpdates();
  const localities = getBuildableLocalities(locale).buildable;
  const counters = {
    cities: getCities().length,
    localities: localities.length,
    projects: getProjects().length,
    circleRateEntries: getCircleRateSchedules().reduce((n, s) => n + s.rates.length, 0),
    lastUpdated: [...getCities(), ...localities, ...getProjects(), ...updates]
      .map((r) => r.updatedAt)
      .sort()
      .at(-1),
  };
  return (
    <PageShell locale={locale} alternate={sameAlternate(locale, "/")}>
      <h1>{locale === "hi" ? "अवधलैंड" : "Awadhland"}</h1>
      <WhatChanged locale={locale} updates={updates.slice(0, 3)} />
      <DataDump
        data={{
          counters,
          whatChanged: updates.slice(0, 3).map((u) => u.id),
          cities: getCities().map((c) => c.id),
          broker: getBroker().id,
          latestGuides: getGuides(locale)
            .slice(0, 4)
            .map((g) => g.frontmatter.slug),
        }}
      />
    </PageShell>
  );
}
