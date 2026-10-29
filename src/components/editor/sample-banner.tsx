"use client";

import { Sparkles, X } from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

export function SampleBanner() {
  const { isSample, dismissSample, startFresh } = useResumeStore();
  if (!isSample) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#DBC9A7]/70 bg-[#F8F1E3] px-3.5 py-3">
      <div
        className="pointer-events-none absolute -right-4 -top-5 h-16 w-16 rounded-full bg-[#C9A46A]/10 blur-md"
        aria-hidden="true"
      />
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C9A46A]/25 bg-[#FCF7EC] text-[#8A652E]">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 pr-5">
          <p className="text-[11.5px] font-semibold text-[#5F4A28]">
            You&apos;re exploring sample content
          </p>
          <p className="mt-0.5 text-[10.5px] leading-5 text-[#7A6544]">
            Every field is editable. Switch templates on the right, or clear
            the page and start with your own story.
          </p>
          <ConfirmDialog
            title="Start fresh?"
            description="This clears the sample content and leaves you with a blank resume. Your selected template and accent color stay put."
            confirmLabel="Start fresh"
            destructive
            onConfirm={async () => {
              await startFresh();
            }}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 mt-1 h-7 px-2 text-[10.5px] font-semibold text-[#7A5B2C] hover:bg-[#C9A46A]/10 hover:text-[#5F4A28]"
              >
                Start fresh
              </Button>
            }
          />
        </div>
        <button
          type="button"
          onClick={dismissSample}
          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-[#8D7651]/70 transition-colors hover:bg-[#C9A46A]/10 hover:text-[#5F4A28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A652E]/25"
          aria-label="Dismiss sample notice"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
