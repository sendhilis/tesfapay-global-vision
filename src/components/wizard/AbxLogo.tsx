type Props = { className?: string; showMark?: boolean; tone?: "ink" | "cream" };

export function AbxLogo({ className = "", showMark = true, tone = "ink" }: Props) {
  const fill = tone === "ink" ? "var(--abx-ink)" : "var(--abx-cream)";
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className="font-serif font-bold tracking-tight leading-none"
        style={{ color: fill, fontSize: "1.6em" }}
      >
        ABX
      </span>
      {showMark && <Diamond className="h-[0.9em] w-[0.9em]" />}
    </div>
  );
}

export function Diamond({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 1 L14.2 9.8 L23 12 L14.2 14.2 L12 23 L9.8 14.2 L1 12 L9.8 9.8 Z"
        fill="var(--abx-teal)"
      />
    </svg>
  );
}
