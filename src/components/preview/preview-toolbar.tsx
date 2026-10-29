"use client";

import * as React from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { ACCENTS, TEMPLATES, type TemplateId } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AtsDialog } from "@/components/preview/ats-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function TemplateGlyph({
  template,
  active,
}: {
  template: TemplateId;
  active: boolean;
}) {
  const line = active ? "bg-ink/60" : "bg-ink/25";
  if (template === "executive") {
    return (
      <span className="flex h-4 w-4 flex-col items-center justify-center gap-[2px]">
        <span className={cn("h-[2px] w-2.5 rounded-full", line)} />
        <span className={cn("h-[1px] w-3.5 rounded-full", line)} />
        <span className={cn("h-[1px] w-3.5 rounded-full", line)} />
        <span className={cn("h-[1px] w-2 rounded-full", line)} />
      </span>
    );
  }
  return (
    <span className="flex h-4 w-4 flex-col justify-center gap-[2px]">
      <span className={cn("h-[2px] w-2 rounded-full", line)} />
      <span className={cn("h-[1px] w-3.5 rounded-full", line)} />
      <span className={cn("h-[1px] w-3 rounded-full", line)} />
      <span className={cn("h-[1px] w-1.5 rounded-full", line)} />
    </span>
  );
}

function TemplateSwitcher() {
  const { resume, mutate } = useResumeStore();
  if (!resume) return null;

  return (
    <div
      className="flex h-8 items-center rounded-lg border border-line bg-[#F3EFE6] p-[3px]"
      role="group"
      aria-label="Resume template"
    >
      {TEMPLATES.map((template) => {
        const active = resume.template === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() =>
              mutate((current) => ({ ...current, template: template.id }))
            }
            aria-pressed={active}
            title={template.fullName}
            className={cn(
              "flex h-[24px] items-center gap-1.5 rounded-[6px] px-1.5 text-[10.5px] font-semibold transition-all duration-200 sm:px-2",
              active
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,16,0.08)]"
                : "text-ink-quiet hover:text-ink",
            )}
          >
            <TemplateGlyph template={template.id} active={active} />
            <span className="hidden md:inline">{template.name}</span>
            <span className="sr-only md:hidden">{template.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function AccentPicker() {
  const { resume, mutate } = useResumeStore();
  const [open, setOpen] = React.useState(false);
  if (!resume) return null;

  const current =
    ACCENTS.find(
      (accent) =>
        accent.value.toLowerCase() === resume.accent.toLowerCase(),
    ) ?? ACCENTS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 gap-1.5 px-2"
              aria-label={`Accent color: ${current.name}`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                style={{ backgroundColor: current.value }}
                aria-hidden="true"
              />
              <ChevronDown
                className="h-3 w-3 text-ink-quiet"
                aria-hidden="true"
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Accent color</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-[248px] p-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-quiet">
            Accent color
          </p>
          <Palette className="h-3.5 w-3.5 text-ink-quiet/70" aria-hidden="true" />
        </div>
        <div className="mt-2.5 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Accent color">
          {ACCENTS.map((accent) => {
            const selected =
              accent.value.toLowerCase() === resume.accent.toLowerCase();
            return (
              <button
                key={accent.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={accent.name}
                title={accent.name}
                onClick={() => {
                  mutate((current) => ({
                    ...current,
                    accent: accent.value,
                  }));
                  setOpen(false);
                }}
                className={cn(
                  "group relative flex aspect-square items-center justify-center rounded-full border transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  selected
                    ? "border-black/15 shadow-[0_0_0_2px_#FCFBF7,0_0_0_3px_currentColor]"
                    : "border-black/10",
                )}
                style={{
                  backgroundColor: accent.value,
                  color: selected ? accent.value : undefined,
                }}
              >
                {selected ? (
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] leading-4 text-ink-quiet">
          The accent carries through headings, rules, and bullet markers.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function PreviewToolbar() {
  const { resume } = useResumeStore();
  if (!resume) return null;

  const template =
    TEMPLATES.find((item) => item.id === resume.template) ?? TEMPLATES[0];

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2.5 sm:px-4">
      <div className="hidden min-w-0 sm:block">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-quiet">
          Live preview
        </p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-ink-soft">
          {template.fullName}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:flex-none">
        <TemplateSwitcher />
        <AccentPicker />
        <AtsDialog />
      </div>
    </div>
  );
}
