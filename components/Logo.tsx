/**
 * Brand mark for AgentPayd.
 *
 * `LogoMark` is the "AP" monogram from the brand sheet: an angular "A"
 * joined to a "P", crossed by the electric-blue node connector (two nodes
 * linked by a bar) that represents the agent ↔ payment connection. It uses
 * `currentColor` for the letterforms (so it adapts to its surface) and the
 * brand blue for the node.
 *
 * `Wordmark` reproduces the uppercase, wide-tracked "AGENTPAYD" logotype.
 */

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={`shrink-0 text-ink ${className}`}
      aria-label="AgentPayd"
      role="img"
    >
      {/* A — left and right legs */}
      <path
        d="M5 41 L18 8 L31 41"
        className="stroke-current"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* P — stem */}
      <path
        d="M34 8 L34 41"
        className="stroke-current"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      {/* P — bowl */}
      <path
        d="M34 10 H40 a8.5 8.5 0 0 1 0 17 H34"
        className="stroke-current"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Blue node connector */}
      <line
        x1="13"
        y1="29"
        x2="34"
        y2="29"
        className="stroke-accent"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="13" cy="29" r="3.4" className="fill-accent" />
      <circle cx="34" cy="29" r="3.4" className="fill-accent" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-sans font-bold uppercase tracking-[0.2em] ${className}`}
    >
      AgentPayd
    </span>
  );
}
