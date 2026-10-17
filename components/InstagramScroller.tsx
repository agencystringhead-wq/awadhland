"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SocialIcon } from "@/components/ui/SocialIcons";
import { ui, type Locale } from "@/lib/i18n";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/social";

export type InstagramPost = {
  /** Local /images/instagram path (build-time fallback) or an Instagram CDN URL (live) */
  image: string;
  caption: string;
  permalink: string;
  timestamp: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};

type FeedResponse = { source?: string; posts?: InstagramPost[] };

const TILE = 320;

/** Only accept what the Function is documented to return; anything else leaves the fallback in place. */
function usable(posts: unknown): posts is InstagramPost[] {
  return (
    Array.isArray(posts) &&
    posts.length > 0 &&
    posts.every(
      (p) =>
        p && typeof p.image === "string" && /^(https:\/\/|\/images\/)/.test(p.image) && typeof p.permalink === "string" && /^https:\/\/(www\.)?instagram\.com\//.test(p.permalink),
    )
  );
}

/**
 * Instagram scroller above the footer. The build renders the fallback posts (data/instagram-fallback.json),
 * so the section is never empty or waiting on a network call. When it nears the viewport the browser asks
 * /api/instagram-feed once and swaps the live posts in. Tiles are fixed-ratio squares, so the swap moves nothing.
 */
export function InstagramScroller({ locale, initial }: { locale: Locale; initial: InstagramPost[] }) {
  const t = ui[locale];
  const [posts, setPosts] = useState(initial);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      fetch("/api/instagram-feed", { headers: { Accept: "application/json" } })
        .then((r) => (r.ok ? (r.json() as Promise<FeedResponse>) : null))
        .then((data) => {
          if (data?.source === "live" && usable(data.posts)) setPosts(data.posts.slice(0, 8));
        })
        .catch(() => {});
    };
    if (!("IntersectionObserver" in window)) {
      load();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollBy = useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  const arrow = "hidden h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-ink transition-colors hover:border-accent hover:bg-accent hover:text-white md:inline-flex";

  return (
    <section ref={sectionRef} data-component="InstagramScroller" aria-labelledby="instagram-heading" className="border-t border-line bg-cream-deep/60 py-14 md:py-20">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <h2 id="instagram-heading" className="text-[clamp(1.5rem,3vw,2.1rem)]">
              {t.instagramHeading}
            </h2>
            <p className="mt-1.5 font-mono text-sm text-muted">{INSTAGRAM_HANDLE}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => scrollBy(-1)} aria-label={t.instagramPrev} className={arrow}>
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" onClick={() => scrollBy(1)} aria-label={t.instagramNext} className={arrow}>
              <span aria-hidden="true">→</span>
            </button>
            <Button href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" variant="primary" size="sm" icon={<SocialIcon id="instagram" size={18} />}>
              {t.instagramFollow}
            </Button>
          </div>
        </div>

        <ul
          ref={trackRef}
          className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-3 md:-mx-0 md:gap-4 md:px-0 [scrollbar-width:thin]"
          tabIndex={0}
          aria-label={t.instagramHeading}
        >
          {posts.map((p, i) => (
            <li key={`${p.permalink}-${i}`} className="w-[68vw] max-w-[300px] shrink-0 snap-start sm:w-[260px] md:w-[280px]">
              <a
                href={p.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-card border border-line bg-sand no-underline"
              >
                {/* Plain img on purpose (CLAUDE.md): live URLs are Instagram's CDN, fallback files are pre-encoded WebP. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.caption || t.instagramPost}
                  width={TILE}
                  height={TILE}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {p.media_type !== "IMAGE" && (
                  <span
                    className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white"
                    title={p.media_type === "VIDEO" ? t.instagramVideo : t.instagramCarousel}
                  >
                    <span className="sr-only">{p.media_type === "VIDEO" ? t.instagramVideo : t.instagramCarousel}</span>
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      {p.media_type === "VIDEO" ? <path d="M8 5v14l11-7z" /> : <path d="M4 7h12v12H4zM8 3h12v12h-2V5H8z" />}
                    </svg>
                  </span>
                )}
                <span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-ink/20 to-transparent p-3.5 text-left text-[13px] leading-snug text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="line-clamp-4">{p.caption}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
