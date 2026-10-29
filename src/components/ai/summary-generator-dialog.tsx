"use client";

import * as React from "react";
import {
  ArrowRight,
  FileText,
  RotateCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/hooks/use-resume-store";
import { api } from "@/lib/client/api";
import { aiErrorMessage } from "@/lib/ai/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  AiDialogMark,
  AiErrorCallout,
  AiFootnote,
  AiWorking,
} from "@/components/ai/ai-shared";

type Status = "idle" | "loading" | "ready" | "error";

export function SummaryGeneratorDialog() {
  const { resume, mutate } = useResumeStore();
  const [open, setOpen] = React.useState(false);
  const [targetTitle, setTargetTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const requestRef = React.useRef(0);
  const autoRunRef = React.useRef(false);

  const suggestedTitle = React.useMemo(() => {
    if (!resume) return "";
    return (
      resume.headline.trim() ||
      resume.experience.find((entry) => entry.role.trim())?.role.trim() ||
      (resume.title.trim() === "Untitled resume" ? "" : resume.title.trim())
    );
  }, [resume]);

  const generate = React.useCallback(
    async (titleOverride?: string) => {
      if (!resume) return;
      const title = (titleOverride ?? targetTitle).trim();
      if (!title) {
        setStatus("error");
        setError("Add a target job title first so Groq knows what to aim for.");
        return;
      }

      const requestId = ++requestRef.current;
      setStatus("loading");
      setError(null);
      setSummary("");

      try {
        const data = await api.generateSummary({
          targetTitle: title,
          skills: resume.skills.slice(0, 40),
          experience: resume.experience.slice(0, 20).map((entry) => ({
            role: entry.role,
            company: entry.company,
            startDate: entry.startDate,
            endDate: entry.endDate,
            current: entry.current,
            highlights: entry.highlights,
          })),
        });
        if (requestRef.current !== requestId) return;
        setSummary(data.summary);
        setStatus("ready");
      } catch (caught) {
        if (requestRef.current !== requestId) return;
        setError(aiErrorMessage(caught));
        setStatus("error");
      }
    },
    [resume, targetTitle],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      requestRef.current += 1;
      setOpen(false);
      return;
    }

    const title = suggestedTitle || targetTitle;
    autoRunRef.current = false;
    setTargetTitle(title);
    setSummary("");
    setError(null);
    setStatus("idle");
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) {
      autoRunRef.current = false;
      return;
    }
    if (autoRunRef.current) return;
    autoRunRef.current = true;
    if (targetTitle.trim()) void generate(targetTitle);
  }, [open, targetTitle, generate]);

  const applySummary = () => {
    if (!summary.trim()) return;
    mutate((current) => ({ ...current, summary: summary.trim() }));
    setOpen(false);
    toast.success("Summary added", {
      description: "Your new summary is in the editor and will autosave.",
    });
  };

  if (!resume) return null;

  const experienceCount = resume.experience.filter(
    (entry) => entry.role.trim() || entry.company.trim() || entry.highlights.some((line) => line.trim()),
  ).length;
  const wordCount = summary.trim()
    ? summary.trim().split(/\s+/).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5 rounded-md border-accent/20 bg-accent-soft/55 px-2.5 text-[10.5px] font-semibold text-accent shadow-none hover:border-accent/30 hover:bg-accent-soft"
        >
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Generate with AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AiDialogMark />
            <div className="min-w-0">
              <DialogTitle>Draft your summary</DialogTitle>
              <DialogDescription className="mt-1 text-[11.5px] leading-5">
                Groq will write a focused three-sentence summary from your
                title, skills, and experience. Nothing changes until you approve it.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.11em] text-ink-quiet">
              Target title
            </span>
            <Input
              value={targetTitle}
              onChange={(event) => setTargetTitle(event.target.value.slice(0, 160))}
              placeholder="Senior Product Designer"
              maxLength={160}
              aria-label="Target job title for summary"
              className="h-9 text-[12px]"
            />
          </label>
          <div className="flex items-end gap-3 pb-0.5 text-[10px] text-ink-quiet">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent/70" aria-hidden="true" />
              {resume.skills.length} skills
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-accent/70" aria-hidden="true" />
              {experienceCount} {experienceCount === 1 ? "role" : "roles"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[10px] text-ink-quiet">
            <UserRound className="h-3 w-3" aria-hidden="true" />
            Uses your saved profile as context
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void generate()}
            disabled={status === "loading" || targetTitle.trim().length === 0}
            className="h-8"
          >
            {status === "loading" ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                Writing…
              </>
            ) : summary ? (
              <>
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Generate summary
              </>
            )}
          </Button>
        </div>

        <div className="mt-4" aria-live="polite">
          {error ? (
            <AiErrorCallout
              message={error}
              onRetry={
                targetTitle.trim()
                  ? () => void generate()
                  : undefined
              }
              retrying={status === "loading"}
            />
          ) : status === "loading" ? (
            <AiWorking label="Composing three focused sentences…" rows={4} />
          ) : summary ? (
            <div className="rounded-xl border border-accent/15 bg-[linear-gradient(145deg,#F7F5EE_0%,#FBFAF5_55%,#F2F6F1_100%)] p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-quiet">
                Proposed summary
              </p>
              <p className="mt-2 font-display text-[14px] leading-[1.75] tracking-[-0.005em] text-ink">
                {summary}
              </p>
              <p className="mt-3 text-[9.5px] tabular-nums text-ink-quiet">
                {wordCount} words · 3 sentences
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-[#FBF9F4] px-4 py-5 text-center">
              <p className="text-[11.5px] font-semibold text-ink">
                A summary shaped around your next role
              </p>
              <p className="mx-auto mt-1 max-w-[360px] text-[10.5px] leading-4 text-ink-quiet">
                Add a target title, then generate a summary that connects your
                experience to the work you want next.
              </p>
            </div>
          )}
        </div>

        {resume.summary.trim() ? (
          <p className="mt-3 rounded-lg border border-[#C9A46A]/25 bg-[#F8F1E3] px-3 py-2 text-[10px] leading-4 text-[#7A5B2C]">
            Your current summary stays untouched until you choose “Use this summary”.
          </p>
        ) : null}

        <AiFootnote>
          AI drafts are a starting point. Confirm every claim, metric, and
          employer detail reflects your real experience.
        </AiFootnote>

        <DialogFooter className="mt-4 border-t border-line/70 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={applySummary}
            disabled={!summary.trim() || status === "loading"}
            className="gap-1.5"
          >
            {resume.summary.trim() ? "Replace summary" : "Use this summary"}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
