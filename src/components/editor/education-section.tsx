"use client";

import { GraduationCap, Plus } from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import type { EducationEntry } from "@/lib/resume/types";
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

function createEducation(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    school: "",
    degree: "",
    field: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    details: "",
  };
}

export function EducationSection() {
  const { resume, mutate } = useResumeStore();
  if (!resume) return null;

  const addEntry = () => {
    mutate((current) => ({
      ...current,
      education: [...current.education, createEducation()],
    }));
  };

  const updateEntry = (index: number, patch: Partial<EducationEntry>) => {
    mutate((current) => ({
      ...current,
      education: current.education.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const removeEntry = (index: number) => {
    mutate((current) => ({
      ...current,
      education: current.education.filter(
        (_entry, entryIndex) => entryIndex !== index,
      ),
    }));
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    mutate((current) => ({
      ...current,
      education: moveItem(current.education, index, index + direction),
    }));
  };

  return (
    <div>
      {resume.education.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
          title="Add your education"
          description="A degree, a certification, or focused training. Keep the most relevant credential first."
          action={
            <Button type="button" size="sm" onClick={addEntry}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add education
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {resume.education.map((entry, index) => (
            <EntryCard
              key={entry.id}
              eyebrow={`Education ${String(index + 1).padStart(2, "0")}`}
              title={
                [entry.degree.trim(), entry.field.trim(), entry.school.trim()]
                  .filter(Boolean)
                  .join(", ") || "New credential"
              }
              onMoveUp={() => moveEntry(index, -1)}
              onMoveDown={() => moveEntry(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < resume.education.length - 1}
              removeTitle="Remove this education entry?"
              removeDescription="This credential will disappear from the education section of your resume."
              onRemove={() => removeEntry(index)}
            >
              <div className="space-y-3">
                <FieldGrid>
                  <Field label="School" className="sm:col-span-2">
                    <Input
                      value={entry.school}
                      onChange={(event) =>
                        updateEntry(index, { school: event.target.value })
                      }
                      placeholder="Rhode Island School of Design"
                      maxLength={160}
                    />
                  </Field>
                  <Field label="Degree">
                    <Input
                      value={entry.degree}
                      onChange={(event) =>
                        updateEntry(index, { degree: event.target.value })
                      }
                      placeholder="BFA"
                      maxLength={120}
                    />
                  </Field>
                  <Field label="Field of study">
                    <Input
                      value={entry.field}
                      onChange={(event) =>
                        updateEntry(index, { field: event.target.value })
                      }
                      placeholder="Graphic Design"
                      maxLength={120}
                    />
                  </Field>
                  <Field label="Location">
                    <Input
                      value={entry.location}
                      onChange={(event) =>
                        updateEntry(index, { location: event.target.value })
                      }
                      placeholder="Providence, RI"
                      maxLength={120}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start">
                      <Input
                        type="month"
                        value={entry.startDate}
                        onChange={(event) =>
                          updateEntry(index, { startDate: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="End">
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
                  </div>
                </FieldGrid>

                <div className="flex items-center gap-2.5">
                  <Switch
                    id={`education-current-${entry.id}`}
                    checked={entry.current}
                    onCheckedChange={(checked) =>
                      updateEntry(index, {
                        current: checked,
                        endDate: checked ? "" : entry.endDate,
                      })
                    }
                    aria-label="I am currently studying here"
                  />
                  <label
                    htmlFor={`education-current-${entry.id}`}
                    className="cursor-pointer text-[11.5px] font-medium text-ink-soft"
                  >
                    I am currently studying here
                  </label>
                </div>

                <Field label="Details" hint="Optional">
                  <Textarea
                    value={entry.details}
                    onChange={(event) =>
                      updateEntry(index, { details: event.target.value })
                    }
                    placeholder="Honors, relevant coursework, or a notable thesis."
                    rows={2}
                    maxLength={600}
                  />
                </Field>
              </div>
            </EntryCard>
          ))}
        </div>
      )}

      {resume.education.length > 0 ? (
        <AddEntryButton
          onClick={addEntry}
          disabled={resume.education.length >= 10}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add another credential
        </AddEntryButton>
      ) : null}
    </div>
  );
}
