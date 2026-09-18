"use client";

/**
 * Monthly digest signup on the updates index (spec Template 8, section 4). Posts the email to the
 * Worker's /subscribe, which creates the JotForm submission. Without an endpoint the block shows
 * the WhatsApp fallback only.
 */
import { useId, useState, type FormEvent } from "react";
import { ui, type Locale } from "@/lib/i18n";
import { leadsEnabled, subscribeDigest } from "@/lib/leads";

export function SubscribeForm({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const id = useId();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  if (!leadsEnabled) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (String(f.get("website") ?? "")) return;
    setStatus("sending");
    const res = await subscribeDigest(String(f.get("email") ?? ""), locale, window.location.pathname);
    setStatus(res.ok ? "sent" : "failed");
    if (res.ok) form.reset();
  }

  return (
    <form data-component="SubscribeForm" method="post" onSubmit={onSubmit} className="mt-5 flex max-w-lg flex-wrap items-end gap-3">
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className="min-w-[220px] flex-1">
        <label htmlFor={id} className="label-mono mb-2 block">
          {t.email}
        </label>
        <input id={id} name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <button type="submit" disabled={status === "sending"} className="btn btn-ink disabled:opacity-70">
        {status === "sending" ? t.sending : t.subscribeButton}
      </button>
      {status === "sent" && (
        <p role="status" className="w-full text-sm text-accent-deep">
          {t.subscribed}
        </p>
      )}
      {status === "failed" && (
        <p role="alert" className="w-full text-sm text-maroon">
          {t.sendFailed}
        </p>
      )}
    </form>
  );
}
