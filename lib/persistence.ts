// =====================================================================
// Persistence service layer
// =====================================================================
// Pilot Mode persists the whole app state to localStorage (handled in
// lib/store.tsx). This module documents the seam where a real backend
// plugs in: implement `PersistenceAdapter` against Supabase (see
// supabase/schema.sql) and the UI/store stay unchanged.
//
// Swapping to Supabase later:
//   1. Run supabase/schema.sql.
//   2. Implement SupabasePersistence below (createClient + table reads).
//   3. In StoreProvider, hydrate initial state from `adapter.loadState()`
//      and forward mutations to `adapter.*` instead of (or alongside)
//      the localStorage writes.
// =====================================================================

import type { AppState } from "./store";

export interface PersistenceAdapter {
  loadState(): Promise<AppState | null>;
  saveState(state: AppState): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY = "agentpayd_pilot_state_v1";

/** Temporary Pilot Mode adapter — browser localStorage. */
export const localStoragePersistence: PersistenceAdapter = {
  async loadState() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppState) : null;
    } catch {
      return null;
    }
  },
  async saveState(state) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  },
  async clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

// Production adapter (to implement when Supabase is wired):
//
// import { createClient } from "@supabase/supabase-js";
// export class SupabasePersistence implements PersistenceAdapter { ... }
