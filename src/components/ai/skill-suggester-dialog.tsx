"use client";

import * as React from "react";
import {
  Check,
  Cpu,
  Plus,
  RotateCw,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { aiErrorMessage } from "@/lib/ai/client";
import type { SuggestSkillsResponse } from "@/lib/ai/types";
import { cn } from "@/lib/utils";
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

const CATEGORY_META = [
  {
    key: "technical" as const,
    label: "Technical",
    description: "Domain knowledge and hard skills",
    icon: Cpu,
  },
  {
    key: "tools" as const,
    label: "Tools",
    description: "Software, platforms, and technologies",
    icon: Wrench,
  },
  {
    key: "softSkills" as const,
    label: "Soft skills",
    description: "How you lead, collaborate, and communicate",
    icon: Users,
  },
];

interface SkillSuggesterDialogProps {
  defaultTitle: string;
  existingSkills: string[];
  onAddSkill: (skill: string) => void;
}

export function SkillSuggesterDialog({
  defaultTitle,
  existingSkills,
  onAddSkill,
}: SkillSuggesterDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [targetTitle, setTargetTitle] = React.useState(defaultTitle);
  const [industry, setIndustry] = React.useState("");
  const [suggestions, setSuggestions] =
    React.useState<SuggestSkillsResponse | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const requestRef = React.useRef(0);
  const autoRunRef = React.useRef(false);

  const existing = React.useMemo(
    () => new Set(existingSkills.map((skill) => skill.toLowerCase())),
    [existingSkills],
  );
  const atLimit = existingSkills.length >= 40;

  const suggest = React.useCallback(
    async (titleOverride?: string) => {
      const title = (titleOverride ?? targetTitle).trim();
      if (!title) {
        setStatus("error");
        setError("Add a target job title so Groq knows which skills to suggest.");
        return;
      }

      const requestId = ++requestRef.current;
      setStatus("loading");
      setError(null);

      try {
        const data = await api.suggestSkills({
          title,
          industry: industry.trim() || undefined,
        });
        if (requestRef.current !== requestId) return;
        setSuggestions(data);
        setStatus("ready");
      } catch (caught) {
        if (requestRef.current !== requestId) return;
        setError(aiErrorMessage(caught));
        setStatus("error");
      }
    },
    [industry, targetTitle],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      requestRef.current += 1;
      setOpen(false);
      return;
    }

    const title = targetTitle.trim() || defaultTitle;
    autoRunRef.current = false;
    setTargetTitle(title);
    setError(null);
    if (!suggestions) setStatus("idle");
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) {
      autoRunRef.current = false;
      return;
    }
    if (autoRunRef.current) return;
    autoRunRef.current = true;
    if (targetTitle.trim() && !suggestions) void suggest(targetTitle);
  }, [open, suggestions, targetTitle, suggest]);

  const addSkill = (skill: string) => {
    if (atLimit || existing.has(skill.toLowerCase())) return;
    onAddSkill(skill);
    toast.success("Skill added", {
      id: "skill-suggestion-added",
      description: `${skill} is now in your resume.`,
    });
  };

  const suggestionCount = suggestions
    ? suggestions.technical.length +
      suggestions.tools.length +
      suggestions.softSkills.length
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
          Suggest with AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[660px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AiDialogMark />
            <div className="min-w-0">
              <DialogTitle>Find your next skills</DialogTitle>
              <DialogDescription className="mt-1 text-[11.5px] leading-5">
                Groq proposes current, searchable skills for your target role.
                Click any tag to add it — nothing is added automatically.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_auto]">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.11em] text-ink-quiet">
              Target title
            </span>
            <Input
              value={targetTitle}
              onChange={(event) => setTargetTitle(event.target.value.slice(0, 160))}
              placeholder="Product Designer"
              maxLength={160}
              aria-label="Target job title for skill suggestions"
              className="h-9 text-[12px]"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.11em] text-ink-quiet">
              Industry <span className="normal-case tracking-normal text-ink-quiet/60">optional</span>
            </span>
            <Input
              value={industry}
              onChange={(event) => setIndustry(event.target.value.slice(0, 120))}
              placeholder="Fintech"
              maxLength={120}
              aria-label="Industry"
              className="h-9 text-[12px]"
            />
          </label>
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void suggest()}
              disabled={status === "loading" || !targetTitle.trim()}
              className="h-9 w-full sm:w-auto"
            >
              {status === "loading" ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  Suggesting…
                </>
              ) : suggestions ? (
                <>
                  <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Refresh
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Suggest
                </>
              )}
            </Button>
          </div>
        </div>

        <div
          className="mt-4 flex items-center justify-between gap-3 text-[10px] text-ink-quiet"
          aria-live="polite"
        >
          <span>
            {suggestions
              ? `${suggestionCount} suggestions for ${targetTitle.trim() || "your role"}`
              : "Grouped by technical, tools, and soft skills"}
          </span>
          <span className={cn(atLimit && "font-semibold text-[#943E37]")}>
            {existingSkills.length} / 40 in resume
          </span>
        </div>

        <div className="mt-2">
          {error ? (
            <AiErrorCallout
              message={error}
              onRetry={
                targetTitle.trim() ? () => void suggest() : undefined
              }
              retrying={status === "loading"}
            />
          ) : status === "loading" ? (
            <AiWorking label="Researching skills for this role…" rows={5} />
          ) : suggestions ? (
            <div className="space-y-4">
              {atLimit ? (
                <p className="rounded-lg border border-[#C9A46A]/25 bg-[#F8F1E3] px-3 py-2 text-[10px] leading-4 text-[#7A5B2C]">
                  Your resume has 40 skills, the maximum. Remove one to add a new suggestion.
                </p>
              ) : null}
              {CATEGORY_META.map((category) => {
                const items = suggestions[category.key];
                const CategoryIcon = category.icon;
                return (
                  <section key={category.key}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-[#F5F1E8] text-ink-quiet">
                        <CategoryIcon className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-[11px] font-semibold text-ink">
                          {category.label}
                        </h3>
                        <p className="text-[9px] text-ink-quiet">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((skill) => {
                        const added = existing.has(skill.toLowerCase());
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            disabled={added || atLimit}
                            aria-label={
                              added ? `${skill} already added` : `Add ${skill}`
                            }
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:pointer-events-none",
                              added
                                ? "border-accent/20 bg-accent-soft text-accent"
                                : atLimit
                                  ? "border-line bg-[#F5F1E8] text-ink-quiet/50"
                                  : "border-line bg-[#FCFBF7] text-ink-soft hover:border-accent/30 hover:bg-accent-soft/60 hover:text-accent",
                            )}
                          >
                            {added ? (
                              <Check className="h-2.5 w-2.5" aria-hidden="true" />
                            ) : (
                              <Plus className="h-2.5 w-2.5" aria-hidden="true" />
                            )}
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-[#FBF9F4] px-4 py-5 text-center">
              <p className="text-[11.5px] font-semibold text-ink">
                Skills that earn a second look
              </p>
              <p className="mx-auto mt-1 max-w-[360px] text-[10.5px] leading-4 text-ink-quiet">
                Add a target title and Groq will group the most relevant hard
                skills, tools, and soft skills for the role.
              </p>
            </div>
          )}
        </div>

        <AiFootnote>
          Only add skills you can speak to in an interview. Suggestions are a
          prompt for your judgment, not a checklist to claim.
        </AiFootnote>

        <DialogFooter className="mt-4 border-t border-line/70 pt-4">
          <p className="flex-1 text-[10px] text-ink-quiet">
            Click a tag to add it instantly.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
