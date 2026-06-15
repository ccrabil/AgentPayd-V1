import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: boolean;
}

export default function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent = false,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-surface p-5 shadow-card transition-colors ${
        accent ? "border-accent/30" : "border-border"
      }`}
    >
      {accent && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/15 blur-2xl" />
      )}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </p>
        {Icon && (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              accent ? "bg-accentSoft text-accent" : "bg-white/5 text-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {value}
      </p>
      {sublabel && <p className="mt-1.5 text-sm text-muted">{sublabel}</p>}
    </div>
  );
}
