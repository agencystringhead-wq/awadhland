import Script from "next/script";
import { analyticsEnabled, GA_ID } from "@/lib/analytics";

/**
 * GA4 on every page of both trees, production builds only. Rendered by app/(en)/layout and app/hi/layout.
 * Clarity (CLARITY_ID in lib/analytics) is not loaded yet; add it here when the id is set.
 */
export function Analytics() {
  if (!analyticsEnabled || !GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
