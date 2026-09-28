"use client";

/**
 * First-party click analytics for the conversion actions: one document-level listener sends
 * whatsapp_click and checklist_download (the land safety checklist PDF, from whichever page links
 * it) to GA4 through lib/analytics.ts, with the page's path, its city (empty off the city trees)
 * and the block the link sat in as the placement.
 */
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

export function LeadAnalytics({ city }: { locale: Locale; city: string }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      // Name the block the link sits in (Header, Hero, LeadForm, MegaPanel…), not the button primitive.
      const where = a.closest('[data-component]:not([data-component="Button"]):not([data-component="WhatsAppButton"])')?.getAttribute("data-component") ?? "";
      const ga = { page_path: window.location.pathname, city, placement: where };
      if (href.startsWith("https://wa.me/")) trackEvent("whatsapp_click", ga);
      else if (href.includes("/downloads/awadhland-land-safety-checklist-")) trackEvent("checklist_download", ga);
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [city]);
  return null;
}
