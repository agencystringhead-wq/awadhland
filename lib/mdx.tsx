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
import type { TeamMember } from "./schemas";

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
