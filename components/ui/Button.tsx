import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-glow hover:translate-y-[-1px] border border-transparent",
  secondary:
    "border border-border bg-bg text-ink hover:border-accent/40 hover:text-accent",
  ghost: "text-muted hover:bg-surface2 hover:text-ink border border-transparent",
  danger:
    "border border-danger/30 bg-dangerSoft text-danger hover:bg-danger/15",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}
