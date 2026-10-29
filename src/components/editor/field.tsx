import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 flex min-h-[14px] items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.105em] text-ink-quiet">
          {label}
        </span>
        {hint ? (
          <span className="truncate text-[10px] font-normal normal-case tracking-normal text-ink-quiet/75">
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export function FieldGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}
