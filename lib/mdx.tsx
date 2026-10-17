/**
 * Guide body renderer (spec Template 6, sections 2 to 4). Compiles the MDX at build with the data
 * components bound to the page's locale, puts stable ids on H2s for the table of contents, and
 * places the mid-article CTA after the second H2 section. Nothing here runs in the browser.
 */
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Callout } from "@/components/mdx/Callout";
import { Checklist } from "@/components/mdx/Checklist";
import { CircleRate } from "@/components/mdx/CircleRate";
import { Distance } from "@/components/mdx/Distance";
import { GuideProjectCard } from "@/components/mdx/GuideProjectCard";
import { MidArticleCta } from "@/components/mdx/MidArticleCta";
import { ChecklistDownload } from "@/components/mdx/ChecklistDownload";
import { ChecklistSchema, SafetyChecklist } from "@/components/mdx/SafetyChecklist";
import { guideHeadings, MID_CTA_TAG, plainHeadingText, slugifyHeading, withMidArticleCta, type GuideComponentName, type Heading } from "./guide-files";
import type { Locale } from "./i18n";
import type { City, TeamMember } from "./schemas";
import type { UpdateArticle } from "./update-articles";

export type RenderContext = {
  locale: Locale;
  broker: Pick<TeamMember, "whatsapp">;
  /** Human page name for the WhatsApp prefill */
  pageLabel: string;
};

/** Text content of a React tree, for matching rendered H2s to the ids computed from the source. */
function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  const el = node as ReactElement<{ children?: ReactNode }>;
  return el.props ? nodeText(el.props.children) : "";
}

/** The five author-facing components (lib/guide-files GUIDE_COMPONENT_NAMES) plus the template-placed CTA. */
function guideComponents(ctx: RenderContext) {
  const authorFacing = {
    CircleRate: (p: { locality: string }) => <CircleRate locality={p.locality} locale={ctx.locale} />,
    Distance: (p: { from: string; to: string }) => <Distance from={p.from} to={p.to} locale={ctx.locale} />,
    ProjectCard: (p: { id: string }) => <GuideProjectCard id={p.id} locale={ctx.locale} />,
    Callout,
    Checklist,
    SafetyChecklist: (p: { stage?: string; part?: "redFlags" | "documents" }) => <SafetyChecklist {...p} locale={ctx.locale} />,
    ChecklistSchema: (p: { name: string }) => <ChecklistSchema name={p.name} locale={ctx.locale} />,
    ChecklistDownload: () => <ChecklistDownload locale={ctx.locale} />,
  } satisfies Record<GuideComponentName, unknown>;
  return {
    ...authorFacing,
    [MID_CTA_TAG]: () => <MidArticleCta locale={ctx.locale} broker={ctx.broker} pageLabel={ctx.pageLabel} />,
  };
}

export async function renderGuideBody(body: string, ctx: RenderContext): Promise<{ content: ReactElement; headings: Heading[] }> {
  const headings = guideHeadings(body);
  // Ids in document order, keyed by heading text; shifted as H2s render so duplicates get "-2", "-3".
  const pending = new Map<string, string[]>();
  for (const h of headings) pending.set(h.text, [...(pending.get(h.text) ?? []), h.id]);

  const { content } = await compileMDX({
    source: withMidArticleCta(body),
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
    components: {
      ...guideComponents(ctx),
      h2: (props: ComponentProps<"h2">) => {
        const text = plainHeadingText(nodeText(props.children));
        const id = pending.get(text)?.shift() ?? slugifyHeading(text);
        return <h2 id={id} {...props} />;
      },
      a: (props: ComponentProps<"a">) => {
        const external = typeof props.href === "string" && /^https?:\/\//.test(props.href);
        return <a {...props} rel={external ? "noopener" : props.rel} />;
      },
    },
  });
  return { content, headings };
}

/* --------------------------------------------------------- update articles */

/** Spans of a Markdown line that must not get a new link: existing links and bare URLs. */
function protectedSpans(line: string): [number, number][] {
  return [...line.matchAll(/\[[^\]]*\]\([^)]*\)|https?:\/\/\S+/g)].map((m) => [m.index!, m.index! + m[0].length]);
}

/**
 * Links the first mention of each city in an article to its city page, in the order the parts are
 * read. Headings are skipped, as are mentions already inside a link. English matches the whole word;
 * Hindi matches the Devanagari name, since the word-boundary token does not see word edges in Devanagari. Only the
 * brackets and path are added: the article's words are untouched.
 */
export function linkFirstCityMentions(parts: string[], locale: Locale, cities: Pick<City, "id" | "name" | "nameHi">[]): string[] {
  const done = new Set<string>();
  return parts.map((part) =>
    part
      .split("\n")
      .map((line) => {
        if (/^\s*#/.test(line)) return line;
        let out = line;
        for (const c of cities) {
          if (done.has(c.id)) continue;
          const name = locale === "hi" ? c.nameHi : c.name;
          // City names are plain words (no regex metacharacters), so they go into the pattern as they are.
          const re = new RegExp(locale === "hi" ? name : String.raw`\b${name}\b`, "g");
          const spans = protectedSpans(out);
          for (const m of out.matchAll(re)) {
            const at = m.index!;
            if (spans.some(([a, b]) => at >= a && at < b)) continue;
            out = `${out.slice(0, at)}[${m[0]}](${locale === "hi" ? "/hi" : ""}/${c.id}/)${out.slice(at + m[0].length)}`;
            done.add(c.id);
            break;
          }
        }
        return out;
      })
      .join("\n"),
  );
}

/**
 * Update article body: plain Markdown (not MDX, so a stray "<" or "{" in prose cannot break it),
 * H2 ids that match the contents list, external links in a new tab with rel="noopener nofollow",
 * and tables inside a horizontal scroller so they never widen the page on a phone.
 */
export async function renderUpdateArticle(
  article: UpdateArticle,
  ctx: { locale: Locale; cities: Pick<City, "id" | "name" | "nameHi">[] },
): Promise<{ takeaways?: { heading: string; content: ReactElement }; body: ReactElement; disclaimer?: ReactElement }> {
  const [takeawaysMd, bodyMd] = linkFirstCityMentions([article.takeaways?.md ?? "", article.bodyMd], ctx.locale, ctx.cities);
  const pending = new Map<string, string[]>();
  for (const h of article.headings) pending.set(h.text, [...(pending.get(h.text) ?? []), h.id]);

  const components = {
    h2: (props: ComponentProps<"h2">) => {
      const text = plainHeadingText(nodeText(props.children));
      return <h2 id={pending.get(text)?.shift() ?? slugifyHeading(text)} {...props} />;
    },
    a: (props: ComponentProps<"a">) => {
      const external = typeof props.href === "string" && /^https?:\/\//.test(props.href);
      return external ? <a {...props} target="_blank" rel="noopener nofollow" /> : <a {...props} />;
    },
    table: (props: ComponentProps<"table">) => (
      <div className="my-[1.1em] overflow-x-auto" tabIndex={0} role="region" aria-label="Table">
        <table {...props} className="min-w-[32rem]" />
      </div>
    ),
  };
  const compile = (source: string, withIds: boolean) =>
    compileMDX({
      source,
      options: { mdxOptions: { format: "md", remarkPlugins: [remarkGfm] } },
      components: withIds ? components : { a: components.a },
    }).then((r) => r.content);

  return {
    takeaways: article.takeaways ? { heading: article.takeaways.heading, content: await compile(takeawaysMd, false) } : undefined,
    body: await compile(bodyMd, true),
    disclaimer: article.disclaimerMd ? await compile(article.disclaimerMd, false) : undefined,
  };
}
