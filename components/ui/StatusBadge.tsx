import {
  EventStatus,
  InvoiceStatus,
  RenewalStatus,
  EVENT_STATUS_LABELS,
  RENEWAL_LABELS,
} from "@/lib/types";

type Tone = "success" | "warning" | "danger" | "neutral" | "accent";

const TONE_STYLES: Record<Tone, string> = {
  success: "bg-successSoft text-success border-success/20",
  warning: "bg-warningSoft text-warning border-warning/20",
  danger: "bg-dangerSoft text-danger border-danger/20",
  neutral: "bg-white/5 text-muted border-white/10",
  accent: "bg-accentSoft text-accent border-accent/20",
};

function Pill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_STYLES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

const INVOICE_TONE: Record<InvoiceStatus, Tone> = {
  Paid: "success",
  Sent: "accent",
  Overdue: "danger",
  Draft: "neutral",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Pill tone={INVOICE_TONE[status]} label={status} />;
}

const EVENT_TONE: Record<EventStatus, Tone> = {
  verified: "success",
  pending: "warning",
  rejected: "danger",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Pill tone={EVENT_TONE[status]} label={EVENT_STATUS_LABELS[status]} />;
}

const RENEWAL_TONE: Record<RenewalStatus, Tone> = {
  strong: "success",
  needs_attention: "warning",
  at_risk: "danger",
};

export function RenewalBadge({ status }: { status: RenewalStatus }) {
  return <Pill tone={RENEWAL_TONE[status]} label={RENEWAL_LABELS[status]} />;
}

export { Pill };
