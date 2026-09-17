import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FAQ } from "@/components/FAQ";
import { getGuide } from "@/lib/guides";
import { localePath, ui, type Locale } from "@/lib/i18n";
import { guideAlternate } from "@/lib/routes";
import { DataDump, PageShell } from "./PageShell";

/** Template 6. Scaffold: title, FAQ and frontmatter as JSON. MDX body rendering in step 4. */
export function GuideTemplate({ locale, slug }: { locale: Locale; slug: string }) {
  const guide = getGuide(locale, slug);
  if (!guide) notFound();
  const fm = guide.frontmatter;
  return (
    <PageShell locale={locale} alternate={guideAlternate(locale, fm.pairedSlug, fm.cityIds)} pageLabel={fm.title}>
      <div className="container-site pb-12">
        <Breadcrumb
          items={[{ label: ui[locale].home, href: localePath(locale, "/") }, { label: ui[locale].guides }, { label: fm.title }]}
        />
        <h1>{fm.title}</h1>
        <DataDump data={{ frontmatter: fm, file: guide.file }} />
        <FAQ items={fm.faq} />
      </div>
    </PageShell>
  );
}
