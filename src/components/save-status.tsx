"use client";

import * as React from "react";
import { AlertCircle, Check, RotateCw } from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { formatStatusDate } from "@/lib/resume/format";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SaveStatus({ className }: { className?: string }) {
  const { saveState, saveError, lastSavedAt, retrySave } = useResumeStore();
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!lastSavedAt) return;
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [lastSavedAt]);

  if (saveState === "saving") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-quiet",
          className,
        )}
        aria-live="polite"
      >
        <Spinner className="h-3 w-3" />
        Saving changes
      </span>
    );
  }

  if (saveState === "dirty") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-quiet",
          className,
        )}
        aria-live="polite"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#B08A52]" aria-hidden="true" />
        Unsaved changes
      </span>
    );
  }

  if (saveState === "error") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={retrySave}
            className={cn(
              "inline-flex items-center gap-1.5 rounded text-[11px] font-medium text-[#984039] transition-colors hover:text-[#7F2F29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#984039]/25",
              className,
            )}
            aria-live="polite"
          >
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Save failed
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">Retry saving</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-left">
          {saveError ?? "Try saving again."}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-quiet",
        className,
      )}
      aria-live="polite"
    >
      <Check className="h-3 w-3 text-accent" aria-hidden="true" />
      <span>Saved</span>
      {lastSavedAt ? (
        <span className="text-ink-quiet/65">· {formatStatusDate(lastSavedAt)}</span>
      ) : null}
    </span>
  );
}
