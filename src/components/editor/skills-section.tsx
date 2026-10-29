"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { Input } from "@/components/ui/input";
import { SkillSuggesterDialog } from "@/components/ai/skill-suggester-dialog";
import { cn } from "@/lib/utils";

export function SkillsSection() {
  const { resume, mutate } = useResumeStore();
  const [draft, setDraft] = React.useState("");

  if (!resume) return null;

  const addSkills = (values: string[]) => {
    const cleaned = values
      .flatMap((value) => value.split(/[,\n]/))
      .map((value) => value.trim().slice(0, 44))
      .filter(Boolean);
    if (cleaned.length === 0) return;

    mutate((current) => {
      const existing = new Set(
        current.skills.map((skill) => skill.toLowerCase()),
      );
      const additions: string[] = [];
      for (const value of cleaned) {
        const key = value.toLowerCase();
        if (existing.has(key)) continue;
        existing.add(key);
        additions.push(value);
        if (current.skills.length + additions.length >= 40) break;
      }
      if (additions.length === 0) return current;
      return { ...current, skills: [...current.skills, ...additions] };
    });
    setDraft("");
  };

  const removeSkill = (index: number) => {
    mutate((current) => ({
      ...current,
      skills: current.skills.filter(
        (_skill, skillIndex) => skillIndex !== index,
      ),
    }));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkills([draft]);
    } else if (
      event.key === "Backspace" &&
      draft === "" &&
      resume.skills.length > 0
    ) {
      removeSkill(resume.skills.length - 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-[300px] text-[10.5px] leading-5 text-ink-quiet">
          Mirror the language in the job description. Tools, craft, and domains
          all belong here.
        </p>
        <SkillSuggesterDialog
          defaultTitle={
            resume.headline.trim() ||
            resume.experience.find((entry) => entry.role.trim())?.role.trim() ||
            (resume.title.trim() === "Untitled resume" ? "" : resume.title.trim())
          }
          existingSkills={resume.skills}
          onAddSkill={(skill) => addSkills([skill])}
        />
      </div>

      <div
        className={cn(
          "rounded-xl border border-line bg-[#FCFBF7] p-2.5 transition-[border-color,box-shadow] focus-within:border-ink/30 focus-within:ring-[3px] focus-within:ring-ink/[0.05]",
        )}
      >
        {resume.skills.length > 0 ? (
          <ul
            className="mb-2 flex flex-wrap gap-1.5"
            aria-label="Added skills"
          >
            {resume.skills.map((skill, index) => (
              <li key={`${skill}-${index}`}>
                <span className="group inline-flex items-center gap-1.5 rounded-md border border-line bg-surface py-1 pl-2 pr-1 text-[11px] font-medium text-ink-soft transition-colors hover:border-ink/15">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded text-ink-quiet transition-colors hover:bg-[#943E37]/10 hover:text-[#943E37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#943E37]/25"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center gap-1.5">
          <Plus
            className="ml-0.5 h-3.5 w-3.5 shrink-0 text-ink-quiet"
            aria-hidden="true"
          />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (draft.trim()) addSkills([draft]);
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text");
              if (text.includes(",") || text.includes("\n")) {
                event.preventDefault();
                addSkills([text]);
              }
            }}
            placeholder={
              resume.skills.length > 0
                ? "Add another skill…"
                : "Type a skill and press Enter"
            }
            maxLength={44}
            aria-label="Add a skill"
            className="h-7 border-0 bg-transparent px-0 text-[12px] shadow-none focus:bg-transparent focus:ring-0"
          />
          <span className="shrink-0 text-[9.5px] font-medium uppercase tracking-[0.08em] text-ink-quiet/70">
            Enter ↵
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-ink-quiet">
        <span>Press Enter or comma to add</span>
        <span>{resume.skills.length} / 40</span>
      </div>
    </div>
  );
}
