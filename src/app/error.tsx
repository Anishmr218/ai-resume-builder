"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[vellum] Unhandled UI error", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 shrink-0 items-center border-b border-line bg-surface px-4 sm:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-[460px] rounded-2xl border border-line bg-surface p-7 text-center shadow-paper sm:p-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.19em] text-ink-quiet">
            Something slipped
          </p>
          <h1 className="mt-2 font-display text-[27px] leading-tight tracking-[-0.02em] text-ink">
            The page hit an unexpected edge
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-ink-soft">
            Your resume is autosaved, so nothing you wrote is lost. Try again,
            or head back to the studio.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-[10px] text-ink-quiet/70">
              Reference: {error.digest}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={reset}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.assign("/")}
            >
              Back to editor
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
