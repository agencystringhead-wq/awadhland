"use client";

/**
 * Tier 3 wrapper: sticks to the top once tiers 1 and 2 have scrolled away. A sentinel just above
 * the nav is observed; when it leaves the viewport the nav gets data-stuck="true", which the CSS
 * uses to switch to the glass backdrop and reveal the compact wordmark and WhatsApp button.
 * Without JavaScript the nav still sticks (CSS), only the extra controls stay hidden.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

export function StickyNav({ children, className = "" }: { children: ReactNode; className?: string }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="h-px w-full" />
      <div data-component="StickyNav" data-stuck={stuck} className={`sticky top-0 z-40 ${className}`}>
        {children}
      </div>
    </>
  );
}
