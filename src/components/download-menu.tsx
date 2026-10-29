"use client";

import * as React from "react";
import {
  ChevronDown,
  CloudUpload,
  Download,
  ExternalLink,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/hooks/use-resume-store";
import { ApiRequestError, api } from "@/lib/client/api";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type BusyAction = "download" | "export" | "print" | null;

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

export function DownloadMenu() {
  const { resume, saveNow, saveState } = useResumeStore();
  const [busy, setBusy] = React.useState<BusyAction>(null);

  if (!resume) return null;

  const resumeId = resume.id;

  async function ensureSaved() {
    const saved = await saveNow();
    if (!saved) {
      toast.error("Let's finish saving first", {
        description:
          saveState === "error"
            ? "Retry the save from the header, then download again."
            : "Your latest edits are still saving. Try again in a moment.",
      });
    }
    return saved;
  }

  function openPrintDirect(url: string) {
    // Open first, then sever the opener reference. Passing "noopener" makes
    // browsers return null even on success, which would trigger a duplicate
    // navigation in the current tab.
    const popup = window.open(url, "_blank");
    if (popup) {
      try {
        popup.opener = null;
      } catch {
        // Some browsers expose a read-only opener; the new tab still works.
      }
    } else {
      window.location.assign(url);
    }
  }

  function handleFailure(caught: unknown, fallbackOpened?: boolean) {
    if (caught instanceof ApiRequestError) {
      if (caught.status === 401) {
        toast.error("Your session has expired", {
          description: "Reload the page to start a fresh workspace.",
          action: {
            label: "Reload",
            onClick: () => window.location.reload(),
          },
        });
        return;
      }

      if (caught.fallbackUrl) {
        if (fallbackOpened) return;
        toast.info("Use print view for this PDF", {
          description:
            "This host has no server-side PDF engine configured. Print view produces selectable, ATS-friendly text.",
          action: {
            label: "Open print view",
            onClick: () => openPrintDirect(caught.fallbackUrl!),
          },
        });
        return;
      }

      toast.error("Something interrupted the export", {
        description: caught.message,
      });
      return;
    }

    toast.error("Something interrupted the export", {
      description: "Please try again in a moment.",
    });
  }

  async function handleDownload() {
    if (busy) return;
    setBusy("download");
    try {
      if (!(await ensureSaved())) return;
      const { blob, fileName } = await api.downloadPdf(resumeId);
      triggerBlobDownload(blob, fileName);
      toast.success("Your PDF is ready", {
        id: "pdf-ready",
        description: "A4 · selectable text · ATS-friendly structure.",
      });
    } catch (error) {
      handleFailure(error);
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    if (busy) return;

    // Open synchronously so the browser keeps the user gesture, then point the
    // window at the print view once the latest edits are safely persisted.
    const popup = window.open("", "_blank");
    if (popup) {
      try {
        popup.document.write(
          '<!doctype html><title>Preparing print view…</title><body style="font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f7f4ed;color:#1b1d18"><p>Preparing your print view…</p></body>',
        );
        popup.document.close();
      } catch {
        // Cross-window access can fail; navigation below still works.
      }
    }

    setBusy("print");
    try {
      if (!(await ensureSaved())) {
        popup?.close();
        return;
      }
      const url = `/print/${resumeId}?auto=1`;
      if (popup) {
        popup.opener = null;
        popup.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch (error) {
      popup?.close();
      handleFailure(error, true);
    } finally {
      setBusy(null);
    }
  }

  async function handleCloudExport() {
    if (busy) return;
    setBusy("export");
    try {
      if (!(await ensureSaved())) return;
      const result = await api.exportResume(resumeId);
      toast.success("A copy is safely archived", {
        description:
          result.storage === "local"
            ? "Saved to development storage. Configure S3 for production."
            : "Stored in your cloud bucket with a signed link.",
        action: {
          label: "Open",
          onClick: () => openPrintDirect(result.url),
        },
      });
    } catch (error) {
      handleFailure(error);
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null;

  return (
    <div className="inline-flex h-9 shrink-0 overflow-hidden rounded-lg bg-ink shadow-[0_1px_2px_rgba(20,20,16,0.18)] transition-shadow hover:shadow-[0_2px_6px_rgba(20,20,16,0.16)]">
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
        className="inline-flex h-full items-center gap-2 px-3 text-[12.5px] font-semibold text-[#FBFAF5] transition-colors hover:bg-[#2A2C26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40 disabled:opacity-60"
        aria-label="Download resume as PDF"
      >
        {busy === "download" ? (
          <Spinner className="h-3.5 w-3.5 text-white" />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {busy === "download" ? "Preparing" : "Download PDF"}
        </span>
        <span className="sm:hidden">
          {busy === "download" ? "…" : "PDF"}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="inline-flex h-full w-7 items-center justify-center border-l border-white/15 text-[#FBFAF5]/85 transition-colors hover:bg-[#2A2C26] hover:text-[#FBFAF5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40 disabled:opacity-60"
            aria-label="More export options"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[262px]">
          <DropdownMenuLabel>Export resume</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => void handleDownload()} disabled={disabled}>
            <Download aria-hidden="true" />
            <span>Download PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void handlePrint()} disabled={disabled}>
            <Printer aria-hidden="true" />
            <span>Print / Save as PDF</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => void handleCloudExport()}
            disabled={disabled}
          >
            {busy === "export" ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <CloudUpload aria-hidden="true" />
            )}
            <span className="flex flex-col items-start gap-0.5">
              <span>Save copy to cloud</span>
              <span className="text-[10.5px] font-normal text-ink-quiet">
                S3-compatible archive · signed link
              </span>
            </span>
            <ExternalLink
              className="ml-auto !h-3 !w-3 text-ink-quiet/60"
              aria-hidden="true"
            />
          </DropdownMenuItem>
          <div className="mx-2 mt-1 border-t border-line px-0.5 py-2">
            <p className="text-[10px] leading-4 text-ink-quiet">
              Text-based A4 PDF. Standard headings and a single column keep
              your resume parser-friendly.
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
