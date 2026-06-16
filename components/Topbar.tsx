"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bot,
  Activity,
  Receipt,
  TrendingUp,
} from "lucide-react";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/events", label: "Events", icon: Activity },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/investor", label: "Investor", icon: TrendingUp },
];

interface TopbarProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function Topbar({ title, description, action }: TopbarProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
      <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <nav className="flex gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden">
        {MOBILE_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accentSoft text-accent"
                  : "text-muted hover:bg-surface2 hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
