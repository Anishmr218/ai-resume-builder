import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="h-9 w-9 shrink-0"
        fill="none"
      >
        <rect width="40" height="40" rx="11" fill="#1B1D18" />
        <path
          d="M11.5 13.25 20 27.5l8.5-14.25"
          stroke="#F3EEE2"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="29.1" cy="11.2" r="2.1" fill="#C29A5C" />
      </svg>
      {showWordmark ? (
        <span className="wordmark flex flex-col leading-none">
          <span className="font-display text-[21px] font-medium tracking-[-0.015em] text-ink">
            Vellum
          </span>
          <span className="mt-1 text-[7.5px] font-semibold uppercase tracking-[0.26em] text-ink-quiet">
            Resume Studio
          </span>
        </span>
      ) : null}
    </span>
  );
}
