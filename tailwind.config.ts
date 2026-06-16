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
        // Tesla-like light system — bright, confident, minimal.
        bg: "#F7F8FA", // app background (off-white)
        surface: "#FFFFFF", // cards
        surface2: "#F3F4F6", // lifted / hover / code surfaces
        border: "#E5E7EB", // thin borders
        ink: "#111827", // primary text
        muted: "#6B7280", // secondary text
        subtle: "#9CA3AF", // tertiary text
        accent: "#2563EB", // electric blue
        accentSoft: "rgba(37, 99, 235, 0.10)",
        success: "#16A34A",
        successSoft: "rgba(22, 163, 74, 0.10)",
        warning: "#D97706",
        warningSoft: "rgba(217, 119, 6, 0.10)",
        danger: "#DC2626",
        dangerSoft: "rgba(220, 38, 38, 0.10)",
      },
      fontFamily: {
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
        // Soft, premium light-mode shadows (no heavy dark glow).
        glow: "0 0 0 1px rgba(37,99,235,0.16), 0 12px 30px -12px rgba(37,99,235,0.30)",
        card: "0 1px 2px rgba(16,24,40,0.04), 0 10px 24px -16px rgba(16,24,40,0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 1px 1px, rgba(17,24,39,0.05) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
