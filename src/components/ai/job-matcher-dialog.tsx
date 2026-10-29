"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Lock,
  ScanSearch,
  Target,
} from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { api } from "@/lib/client/api";
import { aiErrorMessage } from "@/lib/ai/client";
import type { MatchJobResponse } from "@/lib/ai/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ProgressRing } from "@/components/progress-ring";
import {
  AiDialogMark,
  AiErrorCallout,
  AiFootnote,
  AiWorking,
} from "@/components/ai/ai-shared";

type Status = "idle" | "loading" | "ready" | "error";

function scoreTone(score: number) {
  if (score >= 80) {
    return {
      label: "Strong match",
      detail: "Most critical requirements are visible.",
      ring: "text-accent",
      badge: "border-accent/15 bg-accent-soft text-accent",
    };
  }
  if (score >= 60) {
    return {
      label: "Promising match",
      detail: "Several targeted edits could move this higher.",
      ring: "text-[#96682C]",
      badge: "border-[#C9A46A]/25 bg-[#F8F1E3] text-[#7A5B2C]",
    };
  }
  return {
    label: "Worth tailoring",
    detail: "Important requirements or keywords are still missing.",
    ring: "text-[#943E37]",
    badge: "border-[#943E37]/20 bg-[#FBF2F0] text-[#7B3530]",
  };
}

interface JobMatcherDialogProps {
  trigger?: React.ReactNode;
}

export function JobMatcherDialog({ trigger }: JobMatcherDialogProps) {
  const { resume } = useResumeStore();
  const [open, setOpen] = React.useState(false);
  const [jobDescription, setJobDescription] = React.useState("");
  const [result, setResult] = React.useState<MatchJobResponse | null>(null);
  const [analyzedDescription, setAnalyzedDescription] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const requestRef = React.useRef(0);

  const analyze = React.useCallback(async () => {
    if (!resume) return;
    const description = jobDescription.trim();
    if (description.length < 40) {
      setStatus("error");
      setError("Paste a little more of the job posting — at least 40 characters.");
      return;
    }

    const requestId = ++requestRef.current;
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const data = await api.matchJob(resume, description);
      if (requestRef.current !== requestId) return;
      setResult(data);
      setAnalyzedDescription(description);
      setStatus("ready");
    } catch (caught) {
      if (requestRef.current !== requestId) return;
      setError(aiErrorMessage(caught));
      setStatus("error");
    }
  }, [jobDescription, resume]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      requestRef.current += 1;
      setOpen(false);
      return;
    }
    setOpen(true);
  };

  if (!resume) return null;

  const tone = result ? scoreTone(result.score) : null;
  const descriptionChanged =
    Boolean(result) && jobDescription.trim() !== analyzedDescription;
  const hasEnoughText = jobDescription.trim().length >= 40;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 gap-1.5 px-2.5"
          >
            <ScanSearch className="h-3.5 w-3.5 text-ink-quiet" aria-hidden="true" />
            <span className="hidden sm:inline">AI job match</span>
            <span className="sm:hidden">Match</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AiDialogMark />
            <div className="min-w-0">
              <DialogTitle>ATS job matcher</DialogTitle>
              <DialogDescription className="mt-1 text-[11.5px] leading-5">
                Paste a real job posting. Groq estimates how well your resume
                aligns, then names the gaps and the edits worth making first.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="job-matcher-description"
            className="text-[9.5px] font-semibold uppercase tracking-[0.11em] text-ink-quiet"
          >
            Job description
          </label>
          <span className="text-[9.5px] tabular-nums text-ink-quiet/70">
            {jobDescription.trim().length.toLocaleString()} / 20,000
          </span>
        </div>
        <Textarea
          id="job-matcher-description"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value.slice(0, 20_000))}
          placeholder="Paste the responsibilities, requirements, and preferred qualifications here…"
          rows={7}
          maxLength={20_000}
          className="mt-1.5 min-h-[136px] text-[12px] leading-5"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2.5">
          <p className="flex items-center gap-1.5 text-[9.5px] leading-4 text-ink-quiet">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Sent to Groq for this analysis only. Vellum doesn&apos;t save the posting.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => void analyze()}
            disabled={status === "loading" || !hasEnoughText}
            className="h-8 gap-1.5"
          >
            {status === "loading" ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                Analyzing…
              </>
            ) : (
              <>
                <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
                Analyze match
              </>
            )}
          </Button>
        </div>

        <div className="mt-4" aria-live="polite">
          {error ? (
            <AiErrorCallout
              message={error}
              onRetry={hasEnoughText ? () => void analyze() : undefined}
              retrying={status === "loading"}
            />
          ) : status === "loading" ? (
            <AiWorking
              label="Comparing requirements, keywords, and scope…"
              rows={6}
            />
          ) : result && tone ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 rounded-xl border border-line bg-[linear-gradient(135deg,#F8F5ED_0%,#FCFBF7_52%,#F2F6F1_100%)] p-4 sm:flex-row sm:items-center">
                <ProgressRing
                  value={result.score}
                  size={94}
                  strokeWidth={6}
                  label={`${result.score} out of 100 estimated match`}
                  indicatorClassName={tone.ring}
                  trackClassName="text-[#E5DFD2]"
                  className="mx-auto sm:mx-0"
                >
                  <span className="flex flex-col items-center">
                    <span className="text-[24px] font-bold leading-none tabular-nums text-ink">
                      {result.score}
                      <span className="text-[10px] font-semibold text-ink-quiet">
                        %
                      </span>
                    </span>
                    <span className="mt-1 text-[7.5px] font-semibold uppercase tracking-[0.12em] text-ink-quiet">
                      match
                    </span>
                  </span>
                </ProgressRing>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h3 className="font-display text-[19px] tracking-[-0.015em] text-ink">
                      {tone.label}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "normal-case tracking-normal",
                        tone.badge,
                      )}
                    >
                      AI estimate
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-ink-soft">
                    {tone.detail}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9.5px] text-ink-quiet sm:justify-start">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="h-3 w-3" aria-hidden="true" />
                      {result.missingKeywords.length} keyword gaps
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="h-3 w-3" aria-hidden="true" />
                      {result.suggestions.length} priority edits
                    </span>
                  </div>
                </div>
              </div>

              {descriptionChanged ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#C9A46A]/25 bg-[#F8F1E3] px-3 py-2">
                  <p className="text-[10px] leading-4 text-[#7A5B2C]">
                    The job description changed since this analysis.
                  </p>
                  <button
                    type="button"
                    onClick={() => void analyze()}
                    className="text-[10px] font-semibold text-[#7A5B2C] underline decoration-[#7A5B2C]/30 underline-offset-2 hover:decoration-[#7A5B2C]"
                  >
                    Re-analyze
                  </button>
                </div>
              ) : null}

              <section>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-quiet">
                    <Target className="h-3.5 w-3.5 text-[#96682C]" aria-hidden="true" />
                    Missing critical keywords
                  </h3>
                  <span className="text-[9.5px] tabular-nums text-ink-quiet/70">
                    {result.missingKeywords.length}
                  </span>
                </div>
                {result.missingKeywords.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center rounded-md border border-[#C9A46A]/30 bg-[#F8F1E3] px-2 py-1 text-[10.5px] font-medium text-[#7A5B2C]"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-accent/15 bg-accent-soft/60 px-3 py-2 text-[10.5px] text-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    No critical keyword gaps found in this posting.
                  </p>
                )}
              </section>

              <section>
                <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-quiet">
                  <Lightbulb className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Top 3 alignment moves
                </h3>
                <ol className="mt-2 space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion}
                      className="flex items-start gap-2.5 rounded-lg border border-line bg-[#FCFBF7] px-3 py-2.5"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/15 bg-accent-soft text-[9px] font-bold tabular-nums text-accent">
                        {index + 1}
                      </span>
                      <p className="min-w-0 text-[11px] leading-[1.65] text-ink-soft">
                        {suggestion}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>

              <p className="flex items-center gap-1.5 rounded-lg bg-[#F5F1E8] px-3 py-2 text-[9.5px] leading-4 text-ink-quiet">
                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                Results reflect your resume when you clicked Analyze. Re-run
                after edits. This is an AI estimate, not an ATS guarantee.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-[#FBF9F4] px-4 py-5 text-center">
              <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-quiet">
                <ScanSearch className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-2.5 text-[11.5px] font-semibold text-ink">
                See the fit before you apply
              </p>
              <p className="mx-auto mt-1 max-w-[390px] text-[10.5px] leading-4 text-ink-quiet">
                Paste a posting above to get a match score, the keywords your
                resume is missing, and three concrete edits.
              </p>
            </div>
          )}
        </div>

        <AiFootnote>
          Tailor honestly: echo the posting&apos;s language only where it reflects
          your real experience.
        </AiFootnote>

        <DialogFooter className="mt-4 border-t border-line/70 pt-4">
          <p className="flex-1 text-[9.5px] text-ink-quiet">
            Estimates vary by ATS and recruiter.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Keep editing
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
