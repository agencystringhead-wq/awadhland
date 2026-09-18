import type { ComponentProps, ReactNode } from "react";

export type StatusPillProps = { children: ReactNode; className?: string };

/** Status pill with the glowing gold dot: 35px, mono 11px uppercase (reference §9). */
export function StatusPill({ children, className = "" }: StatusPillProps) {
  return (
    <span data-component="StatusPill" className={`pill-status ${className}`}>
      <span aria-hidden="true" className="dot-gold" />
      {children}
    </span>
  );
}

export type PillRadioProps = {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
} & Omit<ComponentProps<"input">, "type" | "name" | "value" | "className">;

/** Pill radio: 40px, 13px; selected state is the accent gradient. Works with no JavaScript. */
export function PillRadio({ name, value, label, defaultChecked, ...rest }: PillRadioProps) {
  return (
    <label data-component="PillRadio" className="pill-radio">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="sr-only" {...rest} />
      {label}
    </label>
  );
}

export type ChipProps = { children: ReactNode; className?: string };

/** Small chip: 13px 500 on sand with a hairline (reference .chip). */
export function Chip({ children, className = "" }: ChipProps) {
  return (
    <span data-component="Chip" className={`chip ${className}`}>
      {children}
    </span>
  );
}
