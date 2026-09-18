"use client";

/**
 * First-party click analytics for the two conversion actions (step 7): one document-level
 * listener records whatsapp_click and call_click through lib/leads.ts. No third-party script,
 * no cookies, no personal data; a no-op when the Worker endpoint is not configured.
 */
import { useEffect } from "react";
import { track } from "@/lib/leads";
import type { Locale } from "@/lib/i18n";

export function LeadAnalytics({ locale }: { locale: Locale }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      // Name the block the link sits in (Header, Hero, LeadForm, MegaPanel…), not the button primitive.
      const where = a.closest('[data-component]:not([data-component="Button"]):not([data-component="WhatsAppButton"])')?.getAttribute("data-component") ?? "";
      if (href.startsWith("https://wa.me/")) track("whatsapp_click", locale, where);
      else if (href.startsWith("tel:")) track("call_click", locale, where);
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [locale]);
  return null;
}
