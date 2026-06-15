"use client";

import { useStore } from "@/lib/store";
import { Role, ROLE_LABELS } from "@/lib/types";
import { useRouter } from "next/navigation";

/**
 * Mock-auth role switcher. Stands in for real authentication:
 *   • AI Vendor / AgentPayd Admin / Viewer → vendor app (/dashboard)
 *   • Business Client → their own portal only (/client-portal/[id])
 * Replace with a real session/login + route middleware later.
 */
export default function RoleSwitcher() {
  const { state, dispatch } = useStore();
  const router = useRouter();

  function onChange(role: Role) {
    dispatch({ type: "SET_ROLE", role });
    if (role === "business_client" && state.currentClientId) {
      router.push(`/client-portal/${state.currentClientId}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="px-2">
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-subtle">
        Viewing as
      </label>
      <select
        value={state.role}
        onChange={(e) => onChange(e.target.value as Role)}
        className="w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-sm text-ink focus:border-accent focus:outline-none"
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </div>
  );
}
