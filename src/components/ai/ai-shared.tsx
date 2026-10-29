"use client";

import * as React from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function AiErrorCallout({
  message,
  onRetry,
  retrying = false,
  className,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-[#943E37]/20 bg-[#FBF2F0] px-3 py-2.5",
        className,
      )}
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#943E37]/10 text-[#943E37]">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-[#7B3530]">
          Groq couldn&apos;t finish that
        </p>
        <p className="mt-0.5 text-[10.5px] leading-4 text-[#7B3530]/85">
          {message}
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="shrink-0 rounded-md border border-[#943E37]/20 bg-white/60 px-2 py-1 text-[10px] font-semibold text-[#7B3530] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#943E37]/25 disabled:opacity-50"
        >
          {retrying ? "Retrying…" : "Retry"}
        </button>
      ) : null}
    </div>
  );
}

export function AiWorking({
  label,
  rows = 3,
  className,
}: {
  label: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "rounded-xl border border-dashed border-line bg-[#FBF9F4] px-4 py-3.5",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-[11px] font-semibold text-ink-soft">
        <Spinner className="h-3.5 w-3.5 text-accent" />
        {label}
      </p>
      <div className="mt-3 space-y-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_item, index) => (
          <div
            key={index}
            className="h-2.5 animate-pulse rounded-full bg-[#EAE4D8]"
            style={{ width: `${94 - index * 13}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function AiDialogMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/15 bg-accent-soft text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
        className,
      )}
      aria-hidden="true"
    >
      <Sparkles className="h-4 w-4" />
    </span>
  );
}

export function AiFootnote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-ink-quiet">
      <Sparkles
        className="mt-0.5 h-3 w-3 shrink-0 text-accent/70"
        aria-hidden="true"
      />
      <span>{children}</span>
    </p>
  );
}
