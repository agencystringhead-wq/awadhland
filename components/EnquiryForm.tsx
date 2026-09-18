"use client";

/**
 * Enquiry form (hero card and the lead-form band). Styled now; JotForm via the Cloudflare Worker
 * arrives in build step 7 and will replace the submit handler. Until then, submitting composes a
 * WhatsApp message from the fields and opens wa.me, so no enquiry is lost and no personal data
 * lands in a URL on our host. With JavaScript off the form does nothing; the WhatsApp and Call
 * links beside it still work.
 */
import { useId, useState, type FormEvent } from "react";
import { whatsappHref } from "@/components/WhatsAppButton";
import type { FormCopy, Option } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import { PillRadio } from "./ui/Pill";

export type EnquiryFormProps = {
  locale: Locale;
  variant: "hero" | "band";
  copy: FormCopy;
  whatsapp: string;
  /** Formatted phone for the "or WhatsApp +91 …" line */
  phoneDisplay: string;
  /** Trust line items, already filled */
  trust: string[];
};

const label = "label-mono mb-2 block";

function Select({ id, name, options, defaultValue }: { id: string; name: string; options: Option[]; defaultValue?: string }) {
  return (
    <select id={id} name={name} className="input select" defaultValue={defaultValue ?? options[0]?.value}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function EnquiryForm({ locale, variant, copy, whatsapp, phoneDisplay, trust }: EnquiryFormProps) {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const [sent, setSent] = useState(false);
  const band = variant === "band";
  const labelOf = (opts: Option[], v: FormDataEntryValue | null) => opts.find((o) => o.value === v)?.label ?? "";

  // TODO(jotform, step 7): post to the Worker endpoint instead of composing a WhatsApp message.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parts = [
      `${copy.waPrefix}`,
      `${copy.name}: ${f.get("name")}`,
      `${copy.phone}: ${f.get("phone")}`,
      f.get("email") ? `${copy.email}: ${f.get("email")}` : "",
      `${copy.city}: ${labelOf(copy.cityOptions, f.get("city"))}`,
      `${copy.lookingFor} ${labelOf(copy.purposes, f.get("purpose"))}`,
      band ? `${copy.budget}: ${labelOf(copy.budgetOptions, f.get("budget"))}` : "",
      band ? `${copy.location} ${labelOf(copy.locationOptions, f.get("location"))}` : "",
      band && f.get("message") ? `${f.get("message")}` : "",
    ].filter(Boolean);
    window.open(whatsappHref(whatsapp, parts.join("\n")), "_blank", "noopener");
    setSent(true);
  }

  return (
    <form
      data-component="EnquiryForm"
      data-variant={variant}
      data-locale={locale}
      method="post"
      onSubmit={onSubmit}
      className={band ? "grid gap-4 sm:grid-cols-2" : ""}
    >
      <div className={band ? "contents" : "grid gap-3.5 sm:grid-cols-2"}>
        <div>
          <label htmlFor={id("name")} className={label}>
            {copy.name}
          </label>
          <input id={id("name")} name="name" required autoComplete="name" className="input" />
        </div>
        <div>
          <label htmlFor={id("phone")} className={label}>
            {copy.phone}
          </label>
          <input id={id("phone")} name="phone" required type="tel" inputMode="tel" autoComplete="tel" defaultValue="+91 " className="input tabular-nums" />
        </div>
        {!band && (
          <div>
            <label htmlFor={id("email")} className={label}>
              {copy.email}
            </label>
            <input id={id("email")} name="email" type="email" autoComplete="email" className="input" />
          </div>
        )}
        <div>
          <label htmlFor={id("city")} className={label}>
            {copy.city}
          </label>
          <Select id={id("city")} name="city" options={copy.cityOptions} />
        </div>
        {band && (
          <div>
            <label htmlFor={id("budget")} className={label}>
              {copy.budget}
            </label>
            <Select id={id("budget")} name="budget" options={copy.budgetOptions} />
          </div>
        )}
      </div>

      <fieldset className={band ? "sm:col-span-2" : "mt-4"}>
        <legend className="label-mono mb-2">
          {copy.lookingFor} <span className="serif-italic normal-case tracking-normal text-[13px] font-normal text-muted">{copy.pickClosest}</span>
        </legend>
        <div className="flex flex-wrap gap-[7px]">
          {copy.purposes.map((p, i) => (
            <PillRadio key={p.value} name="purpose" value={p.value} label={p.label} defaultChecked={i === 0} />
          ))}
        </div>
      </fieldset>

      {band && (
        <>
          <fieldset className="sm:col-span-2">
            <legend className="label-mono mb-2">{copy.location}</legend>
            <div className="flex flex-wrap gap-[7px]">
              {copy.locationOptions.map((o, i) => (
                <PillRadio key={o.value} name="location" value={o.value} label={o.label} defaultChecked={i === 0} />
              ))}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <label htmlFor={id("message")} className={label}>
              {copy.message}
            </label>
            <textarea id={id("message")} name="message" rows={3} className="input min-h-[96px] resize-y" />
          </div>
        </>
      )}

      <div className={`flex flex-wrap items-center gap-3.5 ${band ? "sm:col-span-2 mt-1" : "mt-4"}`}>
        <button type="submit" className={`btn btn-ink btn-lg ${band ? "w-full" : "w-full sm:w-auto sm:min-w-[300px]"} text-[15.5px]`}>
          {band ? copy.bandSubmit : copy.submit}
        </button>
        {!band && (
          <p className="serif-italic text-[13px] text-muted">
            {copy.orWhatsapp}{" "}
            <a href={whatsappHref(whatsapp, "")} rel="noopener" className="font-medium not-italic text-accent-deep tabular-nums">
              {phoneDisplay}
            </a>
          </p>
        )}
      </div>
      {sent && (
        <p role="status" className={`text-sm text-accent-deep ${band ? "sm:col-span-2" : "mt-2"}`}>
          ✓ WhatsApp
        </p>
      )}

      <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4 label-mono text-[11px] ${band ? "sm:col-span-2 mt-2" : "mt-[18px]"}`}>
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 20 20" fill="currentColor" className="text-gold">
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L10 14.9l-5.3 2.8 1.1-5.9L1.5 7.7l5.9-.8z" />
        </svg>
        {trust.map((item, i) => (
          <span key={item} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">·</span>}
            {item}
          </span>
        ))}
      </p>
    </form>
  );
}
