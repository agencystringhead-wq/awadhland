import { analyticsEnabled, GA_ID } from "@/lib/analytics";

/**
 * GA4 on every page of both trees, production builds only. Rendered in <head> by app/(en)/layout and
 * app/hi/layout as plain script tags, not next/script, so the tag is in the served HTML where Google's
 * tag tester looks for it. `async` keeps it off the critical path.
 * Clarity (CLARITY_ID in lib/analytics) is not loaded yet; add it here when the id is set.
 */
export function Analytics() {
  if (!analyticsEnabled || !GA_ID) return null;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`,
        }}
      />
    </>
  );
}
