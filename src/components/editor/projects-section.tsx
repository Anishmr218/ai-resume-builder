"use client";

import { FolderKanban, Plus } from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import type { ProjectEntry } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGrid } from "@/components/editor/field";
import {
  AddEntryButton,
  EmptyState,
  EntryCard,
  moveItem,
} from "@/components/editor/entry-card";

function createProject(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    link: "",
    description: "",
  };
}

export function ProjectsSection() {
  const { resume, mutate } = useResumeStore();
  if (!resume) return null;

  const addEntry = () => {
    mutate((current) => ({
      ...current,
      projects: [...current.projects, createProject()],
    }));
  };

  const updateEntry = (index: number, patch: Partial<ProjectEntry>) => {
    mutate((current) => ({
      ...current,
      projects: current.projects.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    }));
  };

  const removeEntry = (index: number) => {
    mutate((current) => ({
      ...current,
      projects: current.projects.filter(
        (_entry, entryIndex) => entryIndex !== index,
      ),
    }));
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    mutate((current) => ({
      ...current,
      projects: moveItem(current.projects, index, index + direction),
    }));
  };

  return (
    <div>
      {resume.projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-4 w-4" aria-hidden="true" />}
          title="Show something you made"
          description="A side project, a publication, or a product you shipped. Describe the problem and your specific contribution."
          action={
            <Button type="button" size="sm" onClick={addEntry}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add project
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {resume.projects.map((entry, index) => (
            <EntryCard
              key={entry.id}
              eyebrow={`Project ${String(index + 1).padStart(2, "0")}`}
              title={entry.name.trim() || "New project"}
              onMoveUp={() => moveEntry(index, -1)}
              onMoveDown={() => moveEntry(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < resume.projects.length - 1}
              removeTitle="Remove this project?"
              removeDescription="This project and its description will be removed from your resume."
              onRemove={() => removeEntry(index)}
            >
              <div className="space-y-3">
                <FieldGrid>
                  <Field label="Project name" className="sm:col-span-2">
                    <Input
                      value={entry.name}
                      onChange={(event) =>
                        updateEntry(index, { name: event.target.value })
                      }
                      placeholder="Morrow — Calm finance for freelancers"
                      maxLength={140}
                    />
                  </Field>
                  <Field
                    label="Link"
                    hint="Optional"
                    className="sm:col-span-2"
                  >
                    <Input
                      value={entry.link}
                      onChange={(event) =>
                        updateEntry(index, { link: event.target.value })
                      }
                      placeholder="project.design"
                      inputMode="url"
                      maxLength={240}
                    />
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    <Textarea
                      value={entry.description}
                      onChange={(event) =>
                        updateEntry(index, { description: event.target.value })
                      }
                      placeholder="What it is, why it mattered, and one result or signal of traction."
                      rows={3}
                      maxLength={800}
                    />
                  </Field>
                </FieldGrid>
              </div>
            </EntryCard>
          ))}
        </div>
      )}

      {resume.projects.length > 0 ? (
        <AddEntryButton
          onClick={addEntry}
          disabled={resume.projects.length >= 12}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add another project
        </AddEntryButton>
      ) : null}
    </div>
  );
}
