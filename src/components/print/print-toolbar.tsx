"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect } from "react";

export function PrintToolbar({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void document.fonts.ready.then(() => {
        if (!cancelled) window.print();
      });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [autoPrint]);

  return (
    <div className="print-toolbar fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-line bg-[#f8f6f1]/90 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-black/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back to editor</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
        <p className="hidden truncate text-sm text-ink-quiet sm:block">
          Print view · A4
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-xs text-ink-quiet md:block">
          Choose <span className="font-medium text-ink-soft">Save as PDF</span>{" "}
          for selectable, ATS-friendly text.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
