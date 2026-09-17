export type WhatsAppButtonProps = {
  /** wa.me format: country code and number, digits only */
  number: string;
  /** Prefilled message. Page-aware text is composed by the caller. */
  text: string;
  label: string;
};

export function whatsappHref(number: string, text: string): string {
  return text ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/${number}`;
}

/** Stub. Builds the wa.me link; styling in step 2. */
export function WhatsAppButton({ number, text, label }: WhatsAppButtonProps) {
  return (
    <a data-component="WhatsAppButton" href={whatsappHref(number, text)} rel="noopener">
      {label}
    </a>
  );
}
