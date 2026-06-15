"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bot,
  Calculator,
  FlaskConical,
  ScrollText,
  Activity,
  Receipt,
  BadgeCheck,
  Sparkles,
  Tag,
  TrendingUp,
  Code2,
  Settings,
  Stethoscope,
  ShieldCheck,
  ClipboardCheck,
  ClipboardList,
  PlayCircle,
  Upload,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ROLE_LABELS } from "@/lib/types";
import { LogoMark, Wordmark } from "@/components/Logo";
import RoleSwitcher from "@/components/RoleSwitcher";
import VendorSwitcher from "@/components/VendorSwitcher";
import PilotBadge from "@/components/ui/PilotBadge";

const NAV_SECTIONS = [
  {
    heading: "Operate",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/agents", label: "AI Agents", icon: Bot },
      { href: "/events", label: "Usage Events", icon: Activity },
      { href: "/verify", label: "Verification Queue", icon: BadgeCheck },
      { href: "/automation", label: "Automation", icon: Bot },
      { href: "/audit-log", label: "Audit Log", icon: ScrollText },
    ],
  },
  {
    heading: "Monetize",
    items: [
      { href: "/pricing-plans", label: "Pricing Plans", icon: Tag },
      { href: "/economics", label: "Unit Economics", icon: Calculator },
      { href: "/invoices", label: "Invoices", icon: Receipt },
      { href: "/value-proof", label: "Value Proof", icon: ShieldCheck },
    ],
  },
  {
    heading: "Grow",
    items: [
      { href: "/investor", label: "Investor View", icon: TrendingUp },
      { href: "/onboarding", label: "Onboard Client", icon: Sparkles },
      { href: "/require-reporting", label: "Require Reporting", icon: ClipboardCheck },
      { href: "/demo-simulator", label: "Demo Simulator", icon: PlayCircle },
      { href: "/healthcare-demo", label: "Healthcare Demo", icon: Stethoscope },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    heading: "Pilot",
    items: [
      { href: "/developers", label: "Developers", icon: Code2 },
      { href: "/import", label: "CSV Import", icon: Upload },
      { href: "/integrations/line", label: "LINE Integration", icon: MessageCircle },
      { href: "/test-scenarios", label: "Test Scenario", icon: FlaskConical },
      { href: "/pilot-readiness", label: "Pilot Readiness", icon: ClipboardList },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { state, vendor } = useStore();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex items-center justify-between px-4 pt-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <Wordmark className="text-sm text-ink" />
        </Link>
      </div>
      <div className="px-4 pt-2">
        <PilotBadge />
      </div>

      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accentSoft text-accent"
                        : "text-muted hover:bg-white/5 hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border px-3 py-4">
        <VendorSwitcher />
        <RoleSwitcher />
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-ink">
            {vendor.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {vendor.name}
            </p>
            <p className="text-xs text-muted">{ROLE_LABELS[state.role]}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
