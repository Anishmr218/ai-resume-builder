import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  label?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 44,
  strokeWidth = 3,
  className,
  trackClassName,
  indicatorClassName,
  label,
  children,
}: ProgressRingProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - normalized / 100);

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      role="img"
      aria-label={label ?? `${Math.round(normalized)} percent complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("text-line", trackClassName)}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "text-accent transition-[stroke-dashoffset] duration-700 ease-out-expo",
            indicatorClassName,
          )}
          stroke="currentColor"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {children}
      </span>
    </div>
  );
}
