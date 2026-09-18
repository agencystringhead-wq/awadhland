export type DividerProps = { className?: string; /** dotted variant used under review quotes */ dotted?: boolean };

/** 1px hairline in the rule colour. */
export function Divider({ className = "", dotted = false }: DividerProps) {
  return <hr data-component="Divider" className={`border-0 border-t ${dotted ? "border-dotted" : ""} border-line ${className}`} />;
}
