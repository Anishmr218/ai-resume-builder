"use client";

import * as React from "react";
import { CloudOff, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { ResumeProvider, useResumeStore } from "@/hooks/use-resume-store";
import { Logo } from "@/components/brand/logo";
import { Header } from "@/components/header";
import { EditorPanel } from "@/components/editor/editor-panel";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type MobileView = "editor" | "preview";

function StudioSkeleton() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4 sm:px-5">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="h-9 w-[104px] animate-pulse rounded-lg bg-[#EFEAE0] sm:w-[132px]" />
          <span className="h-9 w-9 animate-pulse rounded-full bg-[#EFEAE0]" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(360px,42%)_minmax(0,1fr)]">
        <div className="hidden border-r border-line bg-surface p-5 lg:block">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#EFEAE0]" />
          <div className="mt-3 h-6 w-48 animate-pulse rounded-md bg-[#EFEAE0]" />
          <div className="mt-2 h-2.5 w-56 animate-pulse rounded-full bg-[#F2EEE5]" />
          <div className="mt-7 space-y-2.5">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-line bg-[#FBF9F4] px-3.5 py-3"
              >
                <span className="h-8 w-8 animate-pulse rounded-lg bg-[#EFEAE0]" />
                <span className="space-y-1.5">
                  <span className="block h-2.5 w-28 animate-pulse rounded-full bg-[#EFEAE0]" />
                  <span className="block h-2 w-40 animate-pulse rounded-full bg-[#F2EEE5]" />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="preview-canvas flex min-h-0 items-start justify-center overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
          <div className="relative w-full max-w-[620px] animate-pulse rounded-sm bg-white/55 shadow-paper [aspect-ratio:210/297]">
            <div className="absolute inset-x-10 top-10 space-y-3">
              <span className="block h-7 w-2/5 rounded bg-[#EFEAE0]/80" />
              <span className="block h-2 w-1/4 rounded bg-[#EFEAE0]/60" />
              <span className="mt-6 block h-px w-full bg-[#E9E4D9]" />
              <span className="block h-2 w-full rounded bg-[#F1ECE2]" />
              <span className="block h-2 w-11/12 rounded bg-[#F1ECE2]" />
              <span className="block h-2 w-4/5 rounded bg-[#F1ECE2]" />
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only" role="status">
        Preparing your resume studio…
      </span>
    </div>
  );
}

function BootstrapError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => Promise<void>;
}) {
  const [retrying, setRetrying] = React.useState(false);

  async function handleRetry() {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-16 shrink-0 items-center border-b border-line bg-surface px-4 sm:px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-[440px] rounded-2xl border border-line bg-surface p-7 text-center shadow-paper sm:p-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line bg-[#F5F1E8] text-ink-quiet">
            <CloudOff className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-[26px] leading-tight tracking-[-0.02em] text-ink">
            We couldn&apos;t open your studio
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-ink-soft">
            {message ??
              "The workspace didn't respond. Check your connection and try again."}
          </p>

          {process.env.NODE_ENV !== "production" ? (
            <p className="mt-4 rounded-lg border border-line bg-[#FBF9F4] px-3 py-2.5 text-left text-[10.5px] leading-5 text-ink-quiet">
              Local tip: if <code className="font-semibold">DATABASE_URL</code>{" "}
              points at a database that isn&apos;t running, start it or unset
              the variable to use the in-memory preview store.
            </p>
          ) : null}

          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={handleRetry} disabled={retrying}>
              {retrying ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {retrying ? "Reconnecting" : "Try again"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function StudioShell() {
  const { status, error, resume, retryBootstrap, saveNow } = useResumeStore();
  const [mobileView, setMobileView] = React.useState<MobileView>("editor");

  React.useEffect(() => {
    const title = resume?.title?.trim();
    document.title = title ? `${title} · Vellum` : "Vellum — The calm resume studio";
  }, [resume?.title]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        void saveNow().then((saved) => {
          if (saved) {
            toast.success("All changes saved", {
              id: "manual-save",
              description: "Your resume is up to date.",
            });
          }
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveNow]);

  if (status === "loading") return <StudioSkeleton />;
  if (status === "error" || !resume) {
    return <BootstrapError message={error} onRetry={retryBootstrap} />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <a
        href="#resume-editor"
        className="sr-only z-50 focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to editor
      </a>

      <Header
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
      />

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(360px,42%)_minmax(0,1fr)] xl:grid-cols-[minmax(400px,40%)_minmax(0,1fr)]">
        <section
          id="resume-editor"
          aria-label="Resume editor"
          className={cn(
            "min-h-0 overflow-hidden border-line lg:block lg:border-r",
            mobileView === "preview" ? "hidden" : "block",
          )}
        >
          <EditorPanel />
        </section>

        <section
          id="resume-preview"
          aria-label="Live resume preview"
          className={cn(
            "min-h-0 overflow-hidden bg-[#EDE9E0] lg:block",
            mobileView === "editor" ? "hidden" : "block",
          )}
        >
          <PreviewPanel />
        </section>
      </main>
    </div>
  );
}

export function ResumeStudio() {
  return (
    <ResumeProvider>
      <StudioShell />
    </ResumeProvider>
  );
}
