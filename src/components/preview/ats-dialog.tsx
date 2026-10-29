"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { computeAtsReport, type AtsCheck } from "@/lib/resume/compute";
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
import { ProgressRing } from "@/components/progress-ring";
import { cn } from "@/lib/utils";

function scoreLabel(score: number): string {
  if (score >= 88) return "Interview-ready";
  if (score >= 72) return "Strong foundation";
  if (score >= 50) return "Taking shape";
  return "Needs attention";
}

function CheckIcon({ status }: { status: AtsCheck["status"] }) {
  if (status === "pass") {
    return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  }
  if (status === "warn") {
    return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
  }
  return <Sparkles className="h-4 w-4" aria-hidden="true" />;
}

const statusStyles: Record<AtsCheck["status"], string> = {
  pass: "border-accent/15 bg-accent-soft text-accent",
  warn: "border-[#C9A46A]/30 bg-[#F8F1E3] text-[#8A652E]",
  improve: "border-line bg-[#F5F1E8] text-ink-quiet",
};

const statusLabels: Record<AtsCheck["status"], string> = {
  pass: "Pass",
  warn: "Refine",
  improve: "Add",
};

export function AtsDialog() {
  const { resume } = useResumeStore();
  const [open, setOpen] = React.useState(false);

  if (!resume) return null;

  const report = computeAtsReport(resume);
  const label = scoreLabel(report.score);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          aria-label={`ATS readiness score ${report.score} out of 100`}
        >
          <Gauge className="h-3.5 w-3.5 text-ink-quiet" aria-hidden="true" />
          <span className="hidden sm:inline">ATS</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums",
              report.score >= 80
                ? "bg-accent-soft text-accent"
                : "bg-[#F5EDDD] text-[#7A5B2C]",
            )}
          >
            {report.score}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[580px]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <ProgressRing
              value={report.score}
              size={62}
              strokeWidth={4}
              label={`${report.score} out of 100`}
            >
              <span className="text-[15px] font-bold tabular-nums text-ink">
                {report.score}
              </span>
            </ProgressRing>
            <div className="min-w-0">
              <DialogTitle>ATS readiness</DialogTitle>
              <DialogDescription className="mt-1">
                {label} · {report.passed} of {report.total} checks passed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border border-line bg-[#FBF9F4] px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-[10.5px] leading-4 text-ink-soft">
            Standard headings, a single column, and selectable text — no tables
            or images in the document body.
          </p>
        </div>

        <ul className="mt-4 space-y-2" aria-label="ATS checks">
          {report.checks.map((check) => (
            <li
              key={check.id}
              className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  statusStyles[check.status],
                )}
              >
                <CheckIcon status={check.status} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[12px] font-semibold text-ink">
                    {check.label}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-4 border-0 px-1.5 py-0 text-[8.5px] font-semibold",
                      check.status === "pass"
                        ? "bg-accent-soft/70 text-accent"
                        : check.status === "warn"
                          ? "bg-[#F8F1E3] text-[#8A652E]"
                          : "bg-[#F1EDE4] text-ink-quiet",
                    )}
                  >
                    {statusLabels[check.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[10.5px] leading-4 text-ink-quiet">
                  {check.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter className="mt-4 items-center justify-between gap-3 sm:justify-between">
          <p className="flex items-center gap-1.5 text-[10px] text-ink-quiet">
            <Check className="h-3 w-3 text-accent" aria-hidden="true" />
            Guidance only — never a guarantee.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Keep editing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
