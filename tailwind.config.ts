import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — AgentPayd Branding sheet, section 05
        bg: "#0A0A0D", // Void Black
        surface: "#12161C", // Graphite
        surface2: "#171B22", // Graphite, slightly lifted (hover states)
        border: "#1F232B", // Steel
        ink: "#F2F4F7", // Ice
        muted: "#8E939B", // Silver
        subtle: "#5C6370",
        accent: "#0066FF", // Electric Blue
        accentSoft: "rgba(0, 102, 255, 0.12)",
        success: "#22C55E",
        successSoft: "rgba(34, 197, 94, 0.12)",
        warning: "#F5A623",
        warningSoft: "rgba(245, 166, 35, 0.12)",
        danger: "#EF4444",
        dangerSoft: "rgba(239, 68, 68, 0.12)",
      },
      fontFamily: {
        // Brand typeface is Aeonik (geometric, precise, futuristic).
        // Aeonik is a commercial font, so Space Grotesk — the closest
        // open, geometric equivalent — stands in for it everywhere.
        sans: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,102,255,0.3), 0 8px 30px -8px rgba(0,102,255,0.4)",
        card: "0 1px 0 rgba(255,255,255,0.02), 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
