/**
 * Google Analytics 4. Loaded by components/Analytics in both root layouts, production builds only,
 * so `next dev` and preview runs never report. GA sets its own _ga cookies; the privacy page says so.
 * The first-party Worker events in lib/leads.ts keep running alongside.
 */
export const GA_ID = "G-1S205V0N47";
/** Microsoft Clarity, not yet set up. Nothing loads while it is empty. */
export const CLARITY_ID = "";

export const analyticsEnabled = process.env.NODE_ENV === "production";

type Gtag = (command: "event", name: string, params?: Record<string, string | number | undefined>) => void;

/** Sends a GA4 event. A no-op until gtag has loaded, and whenever it is blocked. */
export function trackEvent(name: string, params: Record<string, string | number | undefined> = {}): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", name, params);
  } catch {
    /* analytics must never break the page */
  }
}
