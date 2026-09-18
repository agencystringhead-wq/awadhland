import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "soft" | "ink";
export type ButtonSize = "sm" | "md" | "lg";

type Common = {
  variant?: ButtonVariant;
  /** 40 / 53 / 60px tall (reference .btn-sm / .btn / .btn-lg) */
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

export type ButtonProps = Common &
  (({ href: string } & Omit<ComponentProps<"a">, "className" | "children" | "href">) | ({ href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">));

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  soft: "btn-soft",
  ink: "btn-ink",
};
const sizeClass: Record<ButtonSize, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

/** Pill button. Renders an <a> when `href` is set, otherwise a <button>. */
export function Button({ variant = "primary", size = "md", block = false, icon, className = "", children, ...rest }: ButtonProps) {
  const cls = `btn ${variantClass[variant]} ${sizeClass[size]} ${block ? "w-full" : ""} ${className}`;
  const inner = (
    <>
      {icon}
      {children}
    </>
  );
  if ("href" in rest && rest.href !== undefined) {
    const { href, ...a } = rest as { href: string } & ComponentProps<"a">;
    const external = /^https?:\/\//.test(href);
    return (
      <a data-component="Button" href={href} rel={external ? "noopener" : a.rel} className={cls} {...a}>
        {inner}
      </a>
    );
  }
  const b = rest as ComponentProps<"button">;
  return (
    <button data-component="Button" type={b.type ?? "button"} className={cls} {...b}>
      {inner}
    </button>
  );
}

/** 18px WhatsApp glyph, currentColor. */
export function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4 5.3 5.3 0 0 0 3.2.7 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

/** 16px phone glyph, stroke 1.6, currentColor (reference icon style). */
export function PhoneIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}
