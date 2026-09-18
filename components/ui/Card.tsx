import type { ComponentProps, ElementType, ReactNode } from "react";

export type CardVariant = "flat" | "glass" | "raised";

export type CardProps = {
  /** flat: vellum + hairline; glass: vellum→sand gradient; raised: form card and rating tile */
  variant?: CardVariant;
  /** 28px (reference cards) or 20px compact */
  padding?: "md" | "lg" | "none";
  as?: ElementType;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"div">, "className" | "children">;

const variantClass: Record<CardVariant, string> = { flat: "card", glass: "card-glass", raised: "card-raised" };
const paddingClass = { md: "p-5", lg: "p-7", none: "" } as const;

/** Surface primitive. Radius and shadow come from the variant (reference §5, §8). */
export function Card({ variant = "flat", padding = "lg", as: Tag = "div", className = "", children, ...rest }: CardProps) {
  return (
    <Tag data-component="Card" className={`${variantClass[variant]} ${paddingClass[padding]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
