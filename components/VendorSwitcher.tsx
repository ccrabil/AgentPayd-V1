"use client";

import { useStore } from "@/lib/store";

/**
 * Switches the active AI Vendor. AgentPayd is multi-vendor and
 * cross-industry; this lets the demo show vendors beyond healthcare
 * (real estate, legal, ecommerce, recruiting, hospitality). With real
 * auth, the vendor would come from the signed-in account, not a switcher.
 */
export default function VendorSwitcher() {
  const { state, dispatch } = useStore();

  return (
    <div className="px-2">
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-subtle">
        AI Vendor
      </label>
      <select
        value={state.currentVendorId}
        onChange={(e) =>
          dispatch({ type: "SET_CURRENT_VENDOR", vendorId: e.target.value })
        }
        className="w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-sm text-ink focus:border-accent focus:outline-none"
      >
        {state.vendors.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} · {v.industryFocus}
          </option>
        ))}
      </select>
    </div>
  );
}
