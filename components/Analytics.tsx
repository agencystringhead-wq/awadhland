import Script from "next/script";
import { analyticsEnabled, CLARITY_ID, GA_ID } from "@/lib/analytics";

/**
 * GA4 and Microsoft Clarity on every page of both trees, production builds only. Rendered in <head>
 * by app/(en)/layout and app/hi/layout.
 * GA4 is plain script tags, not next/script, so the tag is in the served HTML where Google's tag
 * tester looks for it; `async` keeps it off the critical path. Clarity goes through next/script
 * (afterInteractive), so it loads after hydration.
 */
export function Analytics() {
  if (!analyticsEnabled) return null;
  return (
    <>
      {GA_ID ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`,
            }}
          />
        </>
      ) : null}
      {CLARITY_ID ? (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      ) : null}
    </>
  );
}
