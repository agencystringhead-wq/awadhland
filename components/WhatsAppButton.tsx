export type WhatsAppButtonProps = {
  /** wa.me format: country code and number, digits only */
  number: string;
  /** Prefilled message. Page-aware text is composed by the caller with whatsappText(). */
  text: string;
  label: string;
  variant?: "primary" | "secondary" | "compact";
};

export function whatsappHref(number: string, text: string): string {
  return text ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/${number}`;
}

const variants = {
  primary: "btn bg-whatsapp text-white hover:bg-accent-deep hover:text-white text-base px-6 py-3",
  secondary: "btn bg-accent-soft text-accent-deep hover:bg-accent hover:text-white",
  compact: "btn bg-whatsapp text-white hover:bg-accent-deep hover:text-white px-3.5 py-2 text-sm",
} as const;

export function WhatsAppButton({ number, text, label, variant = "primary" }: WhatsAppButtonProps) {
  return (
    <a data-component="WhatsAppButton" href={whatsappHref(number, text)} rel="noopener" className={variants[variant]}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4 5.3 5.3 0 0 0 3.2.7 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
      </svg>
      {label}
    </a>
  );
}
