"use client";

import {
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  ScanSearch,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useResumeStore } from "@/hooks/use-resume-store";
import { computeCompleteness } from "@/lib/resume/compute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { ProgressRing } from "@/components/progress-ring";
import { SectionCard } from "@/components/editor/section-card";
import { SampleBanner } from "@/components/editor/sample-banner";
import { JobMatcherDialog } from "@/components/ai/job-matcher-dialog";
import { PersonalSection } from "@/components/editor/personal-section";
import { ExperienceSection } from "@/components/editor/experience-section";
import { EducationSection } from "@/components/editor/education-section";
import { SkillsSection } from "@/components/editor/skills-section";
import { ProjectsSection } from "@/components/editor/projects-section";

function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function EditorPanel() {
  const { resume } = useResumeStore();
  if (!resume) return null;

  const strength = computeCompleteness(resume);
  const bullets = resume.experience.reduce(
    (total, entry) =>
      total + entry.highlights.filter((line) => line.trim()).length,
    0,
  );

  const personalComplete = Boolean(resume.fullName.trim() && resume.email.trim());
  const experienceComplete = resume.experience.some(
    (entry) => entry.role.trim() || entry.company.trim(),
  );
  const educationComplete = resume.education.some((entry) =>
    Boolean(entry.school.trim()),
  );
  const skillsComplete = resume.skills.length >= 3;
  const projectsComplete = resume.projects.some((entry) =>
    Boolean(entry.name.trim()),
  );

  const experienceSummary =
    resume.experience.length > 0
      ? `${pluralize(resume.experience.length, "role")} · ${pluralize(
          bullets,
          "achievement",
        )}`
      : "Add your work history";
  const educationSummary =
    resume.education.length > 0
      ? `${pluralize(resume.education.length, "credential")} and counting`
      : "Degrees, certifications, training";
  const skillsSummary =
    resume.skills.length > 0
      ? `${pluralize(resume.skills.length, "skill")} listed`
      : "Tools, craft, and domain expertise";
  const projectsSummary =
    resume.projects.length > 0
      ? `${pluralize(resume.projects.length, "project")} to explore`
      : "Optional — show what you can make";

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.19em] text-ink-quiet">
            Resume editor
          </p>
          <h2 className="mt-1 font-display text-[23px] leading-none tracking-[-0.025em] text-ink">
            Build your story
          </h2>
          <p className="mt-1.5 text-[10.5px] text-ink-quiet">
            Click any section to edit. Changes appear live.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
          <ProgressRing
            value={strength.percent}
            size={46}
            strokeWidth={3}
            label={`Resume strength: ${strength.percent}%`}
          >
            <span className="text-[10.5px] font-bold tabular-nums text-ink">
              {strength.percent}
              <span className="text-[7px] font-semibold text-ink-quiet">%</span>
            </span>
          </ProgressRing>
          <span className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-ink-quiet">
            {strength.label}
          </span>
        </div>
      </div>

      <div className="scroll-area flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-2.5 px-3.5 py-4 sm:px-4">
          <SampleBanner />

          <div className="overflow-hidden rounded-xl border border-accent/15 bg-[linear-gradient(120deg,#F3F7F1_0%,#FBF9F4_62%,#F7F3EA_100%)] px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent-soft text-accent">
                <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-semibold text-ink">
                    Tailor to a real job
                  </p>
                  <Badge
                    variant="accent"
                    className="h-4 border-0 px-1.5 py-0 text-[8px]"
                  >
                    AI
                  </Badge>
                </div>
                <p className="mt-0.5 text-[9.5px] leading-4 text-ink-quiet">
                  Score the match, spot keyword gaps, and get three fixes.
                </p>
              </div>
              <JobMatcherDialog
                trigger={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 shrink-0 gap-1.5 px-2.5 text-[10.5px]"
                  >
                    <ScanSearch className="h-3 w-3" aria-hidden="true" />
                    Match a job
                  </Button>
                }
              />
            </div>
          </div>

          <Accordion
            type="multiple"
            defaultValue={["personal"]}
            className="space-y-2.5"
          >
            <SectionCard
              value="personal"
              title="Personal details"
              summary={
                personalComplete
                  ? "Name, contact, and professional summary"
                  : "Your name and contact details"
              }
              icon={<UserRound className="h-3.5 w-3.5" aria-hidden="true" />}
              complete={personalComplete}
            >
              <PersonalSection />
            </SectionCard>

            <SectionCard
              value="experience"
              title="Experience"
              summary={experienceSummary}
              icon={
                <BriefcaseBusiness
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              }
              complete={experienceComplete}
            >
              <ExperienceSection />
            </SectionCard>

            <SectionCard
              value="education"
              title="Education"
              summary={educationSummary}
              icon={<GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />}
              complete={educationComplete}
            >
              <EducationSection />
            </SectionCard>

            <SectionCard
              value="skills"
              title="Skills"
              summary={skillsSummary}
              icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
              complete={skillsComplete}
            >
              <SkillsSection />
            </SectionCard>

            <SectionCard
              value="projects"
              title="Projects"
              summary={projectsSummary}
              icon={<FolderKanban className="h-3.5 w-3.5" aria-hidden="true" />}
              complete={projectsComplete}
            >
              <ProjectsSection />
            </SectionCard>
          </Accordion>

          <div className="flex items-center justify-between gap-3 px-1 pb-2 pt-1">
            <Badge variant="secondary" className="font-medium normal-case tracking-normal">
              ATS-first structure
            </Badge>
            <p className="text-right text-[9.5px] leading-4 text-ink-quiet/80">
              Single column · standard headings
            </p>
          </div>
        </div>
      </div>

      <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-t border-line bg-[#FBF9F4] px-4 text-[9.5px] text-ink-quiet">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-accent/70" aria-hidden="true" />
          Autosaves as you type
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <kbd className="rounded border border-line bg-surface px-1 py-px font-sans text-[8.5px] font-medium shadow-sm">
            Ctrl
          </kbd>
          <span className="text-ink-quiet/50">/</span>
          <kbd className="rounded border border-line bg-surface px-1 py-px font-sans text-[8.5px] font-medium shadow-sm">
            ⌘
          </kbd>
          <span>+</span>
          <kbd className="rounded border border-line bg-surface px-1 py-px font-sans text-[8.5px] font-medium shadow-sm">
            S
          </kbd>
          <span className="ml-0.5">to save now</span>
        </span>
      </div>
    </div>
  );
}
