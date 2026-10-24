/**
 * Long-form update articles. An entry in data/updates.json is the record (listing, filters, sitemap,
 * "what changed" strip); an article is an optional body for it, one Markdown file per language in
 * /content/updates (en) and /content/hi/updates (hi), the same split as guides.
 *
 * The article text is never edited here. The loader only splits the file into the parts the template
 * lays out itself (headline, key takeaways, FAQ, sources) and leaves every sentence as written.
 * No dependency on lib/data.ts, so scripts/validate.ts can use it and still report every error in one run.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { isoDate, url, type Locale } from "./schemas";
import { plainHeadingText, slugifyHeading, type Heading } from "./guide-files";

export const UPDATE_ARTICLE_DIRS: Record<Locale, string> = {
  en: path.join("content", "updates"),
  hi: path.join("content", "hi", "updates"),
};

/** Frontmatter as authored. `secondary_keywords` and `schema` are accepted and never rendered. */
export const articleFrontmatterSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected lowercase-hyphenated slug"),
    lang: z.enum(["en", "hi"]),
    /** Site path of the same article in the other tree, e.g. /hi/updates/2026-10-<slug>/ */
    hreflang_pair: z.string().regex(/^(?:\/hi)?\/updates\/[a-z0-9-]+\/$/, "expected /updates/<id>/ or /hi/updates/<id>/"),
    date: isoDate,
    city: z.string().min(1),
    category: z.string().min(1),
    /** Last date of an open registration or application window; the banner flips to "closed" after it */
    deadline: isoDate.optional(),
    meta_title: z.string().min(1),
    meta_description: z.string().min(1),
    primary_keyword: z.string().min(1),
    secondary_keywords: z.array(z.string()).optional(),
    /** Schema.org type of the page's article markup; NewsArticle unless the piece is an explainer or guide */
    schema_type: z.enum(['NewsArticle', 'BlogPosting']).optional(),
    /** Marks the pillar page of a topic cluster; other pieces link up to it. Not rendered. */
    pillar: z.boolean().optional(),
    schema: z.array(z.string()).optional(),
    sources: z.array(z.object({ title: z.string().min(1), url }).strict()).min(1, "every article needs at least one source"),
  })
  .strict();
export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;

export type FaqItem = { q: string; a: string };

export type UpdateArticle = {
  /** Record id in data/updates.json: <yyyy-mm>-<slug> */
  id: string;
  frontmatter: ArticleFrontmatter;
  file: string;
  /** The body's H1, used as the page H1 and the NewsArticle headline */
  title: string;
  /** The italic "Updated … · City · Category" line under the H1, without its asterisks */
  dateline: string;
  takeaways?: { heading: string; md: string };
  /** Body without the H1, dateline, key takeaways, in-body table of contents and sources block */
  bodyMd: string;
  /** One entry per H2 up to and including the FAQ section, in order */
  headings: Heading[];
  faq: FaqItem[];
  /** The closing italic disclaimer, kept as written */
  disclaimerMd: string;
};

const TAKEAWAYS = ["key takeaways", "मुख्य बातें"];
const TOC = ["table of contents", "विषय सूची"];
const FAQ = ["faq", "faqs", "frequently asked questions", "अक्सर पूछे जाने वाले सवाल"];
const SOURCES_MARK = /^\*\*(?:sources?|स्रोत)\*\*\s*$/i;
const RULE = /^\s*(?:---+|\*\*\*+)\s*$/;

const isH2 = (l: string) => /^##\s+\S/.test(l);
const h2Text = (l: string) => plainHeadingText(l.replace(/^##\s+/, "").replace(/\s*#*\s*$/, ""));

/** Markdown inline syntax reduced to the words, for FAQPage answers. */
export function plainText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Consecutive rules and rules at either end of a block removed; text untouched. */
function tidyRules(lines: string[]): string[] {
  const out: string[] = [];
  for (const l of lines) {
    if (RULE.test(l) && (out.length === 0 || RULE.test(out.filter((x) => x.trim() !== "").at(-1) ?? ""))) continue;
    out.push(l);
  }
  while (out.length > 0 && (out.at(-1)!.trim() === "" || RULE.test(out.at(-1)!))) out.pop();
  return out;
}

type Split = Pick<UpdateArticle, "title" | "dateline" | "takeaways" | "bodyMd" | "headings" | "faq" | "disclaimerMd"> & { problems: string[] };

/** Splits an article body into the parts the template lays out. Pure; used by the loader and the validator. */
export function splitArticle(body: string, hasDeadline: boolean): Split {
  const problems: string[] = [];
  let lines = body.replace(/\r\n/g, "\n").split("\n");

  /* H1 and dateline */
  const h1 = lines.findIndex((l) => /^#\s+\S/.test(l));
  if (h1 < 0) problems.push("no H1 (# …) found");
  const title = h1 >= 0 ? plainHeadingText(lines[h1].replace(/^#\s+/, "")) : "";
  let dateline = "";
  if (h1 >= 0) {
    lines.splice(h1, 1);
    const d = lines.findIndex((l, i) => i >= h1 && l.trim() !== "");
    if (d >= 0 && /^\*[^*].*\*$/.test(lines[d].trim())) {
      dateline = lines[d].trim().replace(/^\*|\*$/g, "");
      lines.splice(d, 1);
    }
  }

  /* Sources block and the disclaimer after it: sources render from frontmatter */
  let disclaimerMd = "";
  const mark = lines.findIndex((l) => SOURCES_MARK.test(l.trim()));
  if (mark >= 0) {
    let i = mark + 1;
    while (i < lines.length && (lines[i].trim() === "" || /^\s*[-*]\s/.test(lines[i]))) i++;
    disclaimerMd = lines.slice(i).join("\n").trim();
    lines = lines.slice(0, mark);
  }

  /* Sections by H2. Everything before the first H2 is the preamble. */
  const firstH2 = lines.findIndex(isH2);
  const preamble = firstH2 < 0 ? lines : lines.slice(0, firstH2);
  const rest = firstH2 < 0 ? [] : lines.slice(firstH2);
  type Section = { heading: string; lines: string[] };
  const sections: Section[] = [];
  for (const l of rest) {
    if (isH2(l)) sections.push({ heading: h2Text(l), lines: [l] });
    else sections[sections.length - 1].lines.push(l);
  }

  const lower = (s: Section) => s.heading.toLowerCase();
  const takeawaysSection = sections.find((s) => TAKEAWAYS.includes(lower(s)));
  const faqSection = sections.find((s) => FAQ.includes(lower(s)));
  if (!faqSection) problems.push(`no FAQ section: add an H2 named one of ${FAQ.map((f) => `"${f}"`).join(", ")} with an H3 per question`);

  /* FAQ: H3 question, paragraphs until the next H3 or rule are the answer */
  const faq: FaqItem[] = [];
  if (faqSection) {
    let q: string | null = null;
    let a: string[] = [];
    const flush = () => {
      if (q && a.join(" ").trim()) faq.push({ q: plainText(q), a: plainText(a.join(" ")) });
      q = null;
      a = [];
    };
    for (const l of faqSection.lines.slice(1)) {
      if (/^###\s+\S/.test(l)) {
        flush();
        q = l.replace(/^###\s+/, "");
      } else if (RULE.test(l)) flush();
      else if (q) a.push(l);
    }
    flush();
    if (faq.length === 0) problems.push("the FAQ section has no H3 questions with answers");
  }

  /* Body: the preamble (minus the deadline callout the banner replaces) and every section except takeaways and the in-body contents list */
  const kept: string[] = [];
  const pre = hasDeadline ? preamble.filter((l) => !/^\s*>/.test(l)) : preamble;
  kept.push(...pre);
  for (const s of sections) {
    if (TAKEAWAYS.includes(lower(s)) || TOC.includes(lower(s))) continue;
    kept.push(...s.lines);
  }
  const bodyMd = tidyRules(kept).join("\n").trim();

  const bodyH2 = sections.filter((s) => !TAKEAWAYS.includes(lower(s)) && !TOC.includes(lower(s)));
  const faqAt = faqSection ? bodyH2.indexOf(faqSection) : bodyH2.length - 1;
  const seen = new Map<string, number>();
  const headings: Heading[] = bodyH2.slice(0, faqAt + 1).map((s) => {
    const base = slugifyHeading(s.heading) || "section";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { id: n === 1 ? base : `${base}-${n}`, text: s.heading };
  });

  const takeaways = takeawaysSection
    ? { heading: takeawaysSection.heading, md: tidyRules(takeawaysSection.lines.slice(1)).join("\n").trim() }
    : undefined;

  return { title, dateline, takeaways, bodyMd, headings, faq, disclaimerMd, problems };
}

/** Parses every article for a locale. Returns issues instead of throwing so callers can report all of them. */
export function readUpdateArticles(locale: Locale, root = process.cwd()): { articles: UpdateArticle[]; errors: string[] } {
  const dir = path.join(root, UPDATE_ARTICLE_DIRS[locale]);
  const articles: UpdateArticle[] = [];
  const errors: string[] = [];
  if (!fs.existsSync(dir)) return { articles, errors };

  for (const name of fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()) {
    const file = path.join(UPDATE_ARTICLE_DIRS[locale], name).split(path.sep).join("/");
    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(fs.readFileSync(path.join(dir, name), "utf8"));
    } catch (e) {
      errors.push(`${file}: frontmatter is not valid YAML (${(e as Error).message})`);
      continue;
    }
    // gray-matter turns unquoted YAML dates into Date objects; the schema expects YYYY-MM-DD strings.
    const data = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : v]));
    const result = articleFrontmatterSchema.safeParse(data);
    if (!result.success) {
      errors.push(`${file}:\n${z.prettifyError(result.error)}`);
      continue;
    }
    const fm = result.data;
    if (`${fm.slug}.md` !== name) errors.push(`${file}: slug "${fm.slug}" does not match file name`);
    if (fm.lang !== locale) errors.push(`${file}: lang "${fm.lang}" but file is in the ${locale} tree`);
    const split = splitArticle(parsed.content, Boolean(fm.deadline));
    for (const p of split.problems) errors.push(`${file}: ${p}`);
    const { problems: _problems, ...parts } = split;
    void _problems;
    articles.push({ id: `${fm.date.slice(0, 7)}-${fm.slug}`, frontmatter: fm, file, ...parts });
  }
  return { articles, errors };
}

/** What the record file must agree with: ids and dates from data/updates.json, ids of cities with a page. */
export type ArticleRefs = { updates: Map<string, { date: string }> };

/** Pairing and record checks. Both trees are needed, so this runs after both are read. */
export function checkUpdateArticles(byLocale: Record<Locale, UpdateArticle[]>, refs: ArticleRefs): string[] {
  const errors: string[] = [];
  for (const locale of ["en", "hi"] as const) {
    const other = locale === "en" ? "hi" : "en";
    const otherIds = new Set(byLocale[other].map((a) => a.id));
    const seen = new Set<string>();
    for (const a of byLocale[locale]) {
      const fm = a.frontmatter;
      if (seen.has(a.id)) errors.push(`${a.file}: duplicate article id "${a.id}" in the ${locale} tree`);
      seen.add(a.id);
      const record = refs.updates.get(a.id);
      if (!record) errors.push(`${a.file}: no record "${a.id}" in data/updates.json (id is <yyyy-mm of date>-<slug>)`);
      else if (record.date !== fm.date) errors.push(`${a.file}: date ${fm.date} but data/updates.json has ${record.date} for "${a.id}"`);
      const expectedPair = `${other === "hi" ? "/hi" : ""}/updates/${a.id}/`;
      if (fm.hreflang_pair !== expectedPair) errors.push(`${a.file}: hreflang_pair is ${fm.hreflang_pair}, expected ${expectedPair}`);
      if (!otherIds.has(a.id)) errors.push(`${a.file}: no ${other} article for "${a.id}" in ${UPDATE_ARTICLE_DIRS[other]}/`);
    }
  }
  return errors;
}

/** Compiles each body with the same options the renderer uses, so a syntax error fails validate, not the page. */
export async function checkUpdateArticleBodies(articles: UpdateArticle[]): Promise<string[]> {
  const [{ compile }, { default: remarkGfm }] = await Promise.all([import("@mdx-js/mdx"), import("remark-gfm")]);
  const errors: string[] = [];
  for (const a of articles) {
    for (const [part, md] of [["body", a.bodyMd], ["key takeaways", a.takeaways?.md ?? ""], ["disclaimer", a.disclaimerMd]] as const) {
      if (!md) continue;
      try {
        await compile(md, { remarkPlugins: [remarkGfm], format: "md", outputFormat: "function-body" });
      } catch (e) {
        errors.push(`${a.file}: ${part} does not compile (${(e as Error).message})`);
      }
    }
  }
  return errors;
}

/* ------------------------------------------------------------ runtime access */

const cache = new Map<Locale, UpdateArticle[]>();

/** Both trees read and cross-checked on first use; throws on any problem so a bad article cannot ship. */
export function getUpdateArticles(locale: Locale): UpdateArticle[] {
  const hit = cache.get(locale);
  if (hit) return hit;
  const en = readUpdateArticles("en");
  const hi = readUpdateArticles("hi");
  const errors = [...en.errors, ...hi.errors];
  if (errors.length > 0) throw new Error(`Invalid update articles:\n- ${errors.join("\n- ")}`);
  cache.set("en", en.articles);
  cache.set("hi", hi.articles);
  return locale === "en" ? en.articles : hi.articles;
}

export const getUpdateArticle = (locale: Locale, id: string) => getUpdateArticles(locale).find((a) => a.id === id);
