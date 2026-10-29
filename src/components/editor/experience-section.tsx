"use client";

import * as React from "react";
import { BriefcaseBusiness, Plus } from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import type { ExperienceEntry } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGrid } from "@/components/editor/field";
import {
  AddEntryButton,
  EmptyState,
  EntryCard,
  moveItem,
} from "@/components/editor/entry-card";
import { BulletEnhancerDialog } from "@/components/ai/bullet-enhancer-dialog";

function createExperience(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    role: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    highlights: [""],
  };
}

export function ExperienceSection() {
  const { resume, mutate } = useResumeStore();
  if (!resume) return null;

  const addEntry = () => {
    mutate((current) => ({
      ...current,
      experience: [...current.experience, createExperience()],
    }));
  };

  const updateEntry = (index: number, patch: Partial<ExperienceEntry>) => {
    mutate((current) => ({
      ...current,
      experience: current.experience.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const removeEntry = (index: number) => {
    mutate((current) => ({
      ...current,
      experience: current.experience.filter(
        (_entry, entryIndex) => entryIndex !== index,
      ),
    }));
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    mutate((current) => ({
      ...current,
      experience: moveItem(current.experience, index, index + direction),
    }));
  };

  const applyEnhancedBullet = (
    index: number,
    sourceIndex: number | null,
    variation: string,
  ) => {
    mutate((current) => ({
      ...current,
      experience: current.experience.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;

        const highlights = [...entry.highlights];
        if (sourceIndex !== null && highlights[sourceIndex] !== undefined) {
          highlights[sourceIndex] = variation;
        } else {
          const emptyIndex = highlights.findIndex((line) => !line.trim());
          if (emptyIndex >= 0) highlights[emptyIndex] = variation;
          else highlights.push(variation);
        }

        return { ...entry, highlights: highlights.slice(0, 20) };
      }),
    }));
  };

  return (
    <div>
      {resume.experience.length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />}
          title="Add your first role"
          description="Start with the position most relevant to the job you want. Two to four achievement-led bullets per role is plenty."
          action={
            <Button type="button" size="sm" onClick={addEntry}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add experience
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {resume.experience.map((entry, index) => {
            const bullets = entry.highlights.filter((line) => line.trim()).length;
            return (
              <EntryCard
                key={entry.id}
                eyebrow={`Role ${String(index + 1).padStart(2, "0")}`}
                title={
                  [entry.role.trim(), entry.company.trim()]
                    .filter(Boolean)
                    .join(" · ") || "New role"
                }
                onMoveUp={() => moveEntry(index, -1)}
                onMoveDown={() => moveEntry(index, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < resume.experience.length - 1}
                removeTitle="Remove this role?"
                removeDescription={`This removes ${
                  entry.role.trim() || "this role"
                }${entry.company.trim() ? ` at ${entry.company.trim()}` : ""} and its bullet points from your resume.`}
                onRemove={() => removeEntry(index)}
              >
                <div className="space-y-3">
                  <FieldGrid>
                    <Field label="Role" className="sm:col-span-2">
                      <Input
                        value={entry.role}
                        onChange={(event) =>
                          updateEntry(index, { role: event.target.value })
                        }
                        placeholder="Senior Product Designer"
                        maxLength={120}
                      />
                    </Field>
                    <Field label="Company">
                      <Input
                        value={entry.company}
                        onChange={(event) =>
                          updateEntry(index, { company: event.target.value })
                        }
                        placeholder="Northwind"
                        maxLength={120}
                      />
                    </Field>
                    <Field label="Location">
                      <Input
                        value={entry.location}
                        onChange={(event) =>
                          updateEntry(index, { location: event.target.value })
                        }
                        placeholder="Remote"
                        maxLength={120}
                      />
                    </Field>
                    <Field
                      label="Start date"
                      hint={entry.current ? "Present" : undefined}
                    >
                      <Input
                        type="month"
                        value={entry.startDate}
                        onChange={(event) =>
                          updateEntry(index, { startDate: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="End date">
                      <Input
                        type="month"
                        value={entry.current ? "" : entry.endDate}
                        onChange={(event) =>
                          updateEntry(index, { endDate: event.target.value })
                        }
                        disabled={entry.current}
                        aria-label="End date"
                      />
                    </Field>
                  </FieldGrid>

                  <div className="flex items-center gap-2.5">
                    <Switch
                      id={`experience-current-${entry.id}`}
                      checked={entry.current}
                      onCheckedChange={(checked) =>
                        updateEntry(index, {
                          current: checked,
                          endDate: checked ? "" : entry.endDate,
                        })
                      }
                      aria-label="I currently work here"
                    />
                    <label
                      htmlFor={`experience-current-${entry.id}`}
                      className="cursor-pointer text-[11.5px] font-medium text-ink-soft"
                    >
                      I currently work here
                    </label>
                  </div>

                  <div>
                    <div className="mb-1.5 flex min-h-[22px] flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.105em] text-ink-quiet">
                          Highlights
                        </span>
                        <span className="text-[10px] text-ink-quiet/75">
                          {bullets} {bullets === 1 ? "bullet" : "bullets"}
                        </span>
                      </span>
                      <BulletEnhancerDialog
                        bullets={entry.highlights}
                        targetTitle={entry.role.trim() || resume.headline.trim()}
                        onApply={(variation, sourceIndex) =>
                          applyEnhancedBullet(index, sourceIndex, variation)
                        }
                      />
                    </div>
                    <Textarea
                      value={entry.highlights.join("\n")}
                      onChange={(event) =>
                        updateEntry(index, {
                          highlights: event.target.value
                            .split("\n")
                            .map((line) => line.slice(0, 600)),
                        })
                      }
                      placeholder={
                        "Led a redesign that increased activation by 34%\nBuilt the first design system, adopted by 6 teams"
                      }
                      rows={4}
                      aria-label={`Highlights for ${entry.role.trim() || "this role"}`}
                    />
                    <span className="mt-1.5 block text-[10px] leading-4 text-ink-quiet">
                      One achievement per line. Start with a verb, then add a
                      number or outcome.
                    </span>
                  </div>
                </div>
              </EntryCard>
            );
          })}
        </div>
      )}

      {resume.experience.length > 0 ? (
        <AddEntryButton
          onClick={addEntry}
          disabled={resume.experience.length >= 20}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add another role
        </AddEntryButton>
      ) : null}
    </div>
  );
}
