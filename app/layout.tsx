import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Toast from "@/components/Toast";

// AgentPayd's brand typeface is Aeonik (geometric, precise, futuristic).
// Aeonik is a commercial font and isn't available via next/font, so
// Space Grotesk — a free, similarly geometric sans — is used in its place.
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgentPayd — Prove your AI is worth paying for",
  description:
    "AgentPayd is the billing, metering, cost-tracking, and ROI-proof layer for AI agents. Turn AI-agent activity into revenue, invoices, margins, and renewal-ready ROI reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased bg-bg text-ink">
        <StoreProvider>
          {children}
          <Toast />
        </StoreProvider>
      </body>
    </html>
  );
}
