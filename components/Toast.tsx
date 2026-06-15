"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useStore } from "@/lib/store";

// Lightweight toast bound to store.toast; auto-dismisses after 3.5s.
export default function Toast() {
  const { state, dispatch } = useStore();

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "TOAST", message: null }), 3500);
    return () => clearTimeout(t);
  }, [state.toast, dispatch]);

  if (!state.toast) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2.5 rounded-xl border border-accent/30 bg-surface px-4 py-3 text-sm text-ink shadow-glow">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        {state.toast}
        <button
          onClick={() => dispatch({ type: "TOAST", message: null })}
          className="ml-2 text-muted hover:text-ink"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
