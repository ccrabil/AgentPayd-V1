"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/Logo";
import Button from "@/components/ui/Button";
import { Field, TextInput, Select } from "@/components/ui/Field";
import PilotBadge from "@/components/ui/PilotBadge";
import { useStore } from "@/lib/store";
import { Industry, INDUSTRIES } from "@/lib/types";

const SERVICE_TYPES = [
  "AI automation agency",
  "AI agent company",
  "Chatbot agency",
  "Voice AI agency",
  "Enterprise AI team",
  "Other",
];

// Map a service type to a default industry focus for the new vendor.
const SERVICE_TO_INDUSTRY: Record<string, Industry> = {
  "Voice AI agency": "Healthcare",
  "Chatbot agency": "Ecommerce",
};

export default function SignupPage() {
  const { dispatch } = useStore();
  const router = useRouter();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("Japan");
  const [website, setWebsite] = useState("");
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [industry, setIndustry] = useState<Industry>("Healthcare");

  function createAgency() {
    if (!name || !email) return;
    const id = `vendor-${Date.now()}`;
    dispatch({
      type: "ADD_VENDOR",
      vendor: {
        id,
        name,
        industryFocus: SERVICE_TO_INDUSTRY[serviceType] ?? industry,
        accountType: "vendor",
        tagline: serviceType,
        invoiceRegNo: "",
      },
    });
    dispatch({
      type: "TOAST",
      message: "Agency account created — let's onboard your first client",
    });
    router.push("/onboarding");
  }

  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <Wordmark className="text-sm text-ink" />
          </Link>
          <div className="flex items-center gap-3">
            <PilotBadge />
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted hover:text-ink"
            >
              Skip to demo
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Create your agency account
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Start your pilot
        </h1>
        <p className="mt-2 text-sm text-muted">
          AgentPayd is the monetization and proof-of-value layer for AI agents.
          Set up your AI agency, then onboard your first client and agent.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
          <Field label="Agency / AI vendor name">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cabot Healthcare AI"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Contact person">
              <TextInput
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.jp"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Password" hint="Mock auth in Pilot Mode">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Country">
              <TextInput
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Website" hint="Optional">
            <TextInput
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Primary service type">
              <Select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Main industry focus">
              <Select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as Industry)}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <Button onClick={createAgency} disabled={!name || !email}>
              Create agency &amp; onboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-subtle">
          Mock authentication for Pilot Mode. Real auth (Supabase) plugs into
          the same structure — see supabase/schema.sql.
        </p>
      </div>
    </main>
  );
}
