"use client";

import * as React from "react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGrid } from "@/components/editor/field";
import { SummaryGeneratorDialog } from "@/components/ai/summary-generator-dialog";
import { cn } from "@/lib/utils";

export function PersonalSection() {
  const { resume, mutate } = useResumeStore();
  if (!resume) return null;

  const emailLooksValid =
    resume.email.trim() === "" ||
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(resume.email.trim());
  const summaryWords = resume.summary.trim()
    ? resume.summary.trim().split(/\s+/).length
    : 0;

  return (
    <div className="space-y-4">
      <p className="text-[10.5px] leading-5 text-ink-quiet">
        The essentials recruiters scan first. Keep contact details current and
        your headline specific.
      </p>

      <FieldGrid>
        <Field label="Full name" className="sm:col-span-2">
          <Input
            value={resume.fullName}
            onChange={(event) =>
              mutate((current) => ({ ...current, fullName: event.target.value }))
            }
            placeholder="Avery Sinclair"
            autoComplete="name"
            maxLength={120}
          />
        </Field>

        <Field label="Professional title" className="sm:col-span-2">
          <Input
            value={resume.headline}
            onChange={(event) =>
              mutate((current) => ({ ...current, headline: event.target.value }))
            }
            placeholder="Senior Product Designer"
            autoComplete="organization-title"
            maxLength={160}
          />
        </Field>

        <Field
          label="Email"
          hint={
            emailLooksValid ? undefined : (
              <span className="text-[#943E37]">Check format</span>
            )
          }
        >
          <Input
            value={resume.email}
            onChange={(event) =>
              mutate((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={200}
          />
        </Field>

        <Field label="Phone">
          <Input
            value={resume.phone}
            onChange={(event) =>
              mutate((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="(415) 555-0182"
            type="tel"
            autoComplete="tel"
            maxLength={60}
          />
        </Field>

        <Field label="Location">
          <Input
            value={resume.location}
            onChange={(event) =>
              mutate((current) => ({ ...current, location: event.target.value }))
            }
            placeholder="San Francisco, CA"
            autoComplete="address-level2"
            maxLength={160}
          />
        </Field>

        <Field label="Website" hint="Portfolio">
          <Input
            value={resume.website}
            onChange={(event) =>
              mutate((current) => ({ ...current, website: event.target.value }))
            }
            placeholder="yoursite.com"
            inputMode="url"
            autoComplete="url"
            maxLength={240}
          />
        </Field>

        <Field label="LinkedIn" className="sm:col-span-2">
          <Input
            value={resume.linkedin}
            onChange={(event) =>
              mutate((current) => ({ ...current, linkedin: event.target.value }))
            }
            placeholder="linkedin.com/in/yourname"
            inputMode="url"
            maxLength={240}
          />
        </Field>

        <div className="min-w-0 sm:col-span-2">
          <div className="mb-1.5 flex min-h-[22px] flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.105em] text-ink-quiet">
                Professional summary
              </span>
              <span
                className={cn(
                  "text-[10px] text-ink-quiet/75",
                  summaryWords > 80 && "text-[#96682C]",
                )}
              >
                {summaryWords} {summaryWords === 1 ? "word" : "words"}
              </span>
            </span>
            <SummaryGeneratorDialog />
          </div>
          <Textarea
            value={resume.summary}
            onChange={(event) =>
              mutate((current) => ({ ...current, summary: event.target.value }))
            }
            placeholder="A short paragraph that frames your experience, strengths, and the kind of work you want to do next."
            rows={4}
            maxLength={2000}
            aria-label="Professional summary"
          />
          <span className="mt-1.5 block text-[10px] leading-4 text-ink-quiet">
            2–3 sentences works best. Lead with scope, then a signature result.
          </span>
        </div>

        <Field
          label="Document title"
          hint="Only you see this"
          className="sm:col-span-2"
        >
          <Input
            value={resume.title}
            onChange={(event) =>
              mutate((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Untitled resume"
            maxLength={140}
          />
        </Field>
      </FieldGrid>
    </div>
  );
}
