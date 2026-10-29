import type { Resume, ResumeContent } from "./types";

export interface AtsCheck {
  id: string;
  label: string;
  detail: string;
  status: "pass" | "warn" | "improve";
  weight: number;
}

export interface AtsReport {
  score: number;
  checks: AtsCheck[];
  passed: number;
  total: number;
}

export interface Completeness {
  percent: number;
  label: string;
}

function filled(value: string): boolean {
  return value.trim().length > 0;
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function bulletCount(resume: ResumeContent | Resume): number {
  return resume.experience.reduce(
    (total, entry) =>
      total + entry.highlights.filter((line) => line.trim().length > 0).length,
    0,
  );
}

function quantifiedBullets(resume: ResumeContent | Resume): number {
  return resume.experience.reduce(
    (total, entry) =>
      total +
      entry.highlights.filter(
        (line) => line.trim().length > 0 && /\d/.test(line),
      ).length,
    0,
  );
}

export function resumeWordCount(resume: ResumeContent | Resume): number {
  const segments = [
    resume.summary,
    ...resume.experience.flatMap((entry) => [
      entry.role,
      entry.company,
      ...entry.highlights,
    ]),
    ...resume.education.flatMap((entry) => [
      entry.school,
      entry.degree,
      entry.field,
      entry.details,
    ]),
    ...resume.skills,
    ...resume.projects.flatMap((project) => [
      project.name,
      project.description,
    ]),
  ];
  return segments.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

export function computeCompleteness(
  resume: ResumeContent | Resume,
): Completeness {
  let score = 0;

  if (filled(resume.fullName)) score += 8;
  if (validEmail(resume.email)) score += 5;
  if (filled(resume.headline)) score += 4;
  if (filled(resume.phone)) score += 3;
  if (filled(resume.location)) score += 3;
  if (filled(resume.summary) && resume.summary.trim().length >= 60) score += 10;

  if (resume.experience.length > 0) score += 12;
  if (resume.experience.length >= 2) score += 5;
  if (bulletCount(resume) >= 3) score += 7;
  if (bulletCount(resume) >= 5) score += 4;

  if (resume.education.length > 0) score += 13;
  if (resume.skills.length >= 3) score += 7;
  if (resume.skills.length >= 6) score += 4;
  if (resume.projects.length > 0) score += 8;
  if (filled(resume.website) || filled(resume.linkedin)) score += 3;

  const percent = Math.max(0, Math.min(100, Math.round(score)));
  const label =
    percent >= 90
      ? "Exceptional"
      : percent >= 75
        ? "Strong"
        : percent >= 50
          ? "Taking shape"
          : "Just getting started";

  return { percent, label };
}

export function computeAtsReport(resume: ResumeContent | Resume): AtsReport {
  const totalBullets = bulletCount(resume);
  const quantified = quantifiedBullets(resume);
  const words = resumeWordCount(resume);

  const checks: AtsCheck[] = [
    {
      id: "contact",
      label: "Complete contact details",
      detail:
        validEmail(resume.email) && filled(resume.phone)
          ? "Recruiters can reach you from the first page."
          : "Add a professional email and phone number.",
      status:
        validEmail(resume.email) && filled(resume.phone)
          ? "pass"
          : filled(resume.email) || filled(resume.phone)
            ? "warn"
            : "improve",
      weight: 15,
    },
    {
      id: "headline",
      label: "Clear professional headline",
      detail: filled(resume.headline)
        ? "Your role is immediately clear to a recruiter and ATS."
        : "Add a concise headline such as “Senior Product Designer”.",
      status: filled(resume.headline) ? "pass" : "improve",
      weight: 5,
    },
    {
      id: "summary",
      label: "Focused professional summary",
      detail:
        resume.summary.trim().length >= 80
          ? "A strong opening that frames your experience."
          : "Write 2–3 lines (at least 80 characters) that frame your impact.",
      status:
        resume.summary.trim().length >= 80
          ? "pass"
          : filled(resume.summary)
            ? "warn"
            : "improve",
      weight: 10,
    },
    {
      id: "experience",
      label: "Relevant work experience",
      detail:
        resume.experience.length > 0
          ? `${resume.experience.length} role${resume.experience.length === 1 ? "" : "s"} with details.`
          : "Add at least one role with accomplishments.",
      status: resume.experience.length > 0 ? "pass" : "improve",
      weight: 15,
    },
    {
      id: "achievements",
      label: "Achievement-led bullets",
      detail:
        totalBullets >= 4
          ? `${totalBullets} detailed bullets help your experience read well.`
          : "Use 2–4 bullets per role, starting with an action verb.",
      status: totalBullets >= 4 ? "pass" : totalBullets > 0 ? "warn" : "improve",
      weight: 10,
    },
    {
      id: "metrics",
      label: "Quantified impact",
      detail:
        quantified >= 2
          ? `${quantified} bullets include measurable outcomes.`
          : "Add numbers, percentages, or scale to at least two bullets.",
      status: quantified >= 2 ? "pass" : quantified === 1 ? "warn" : "improve",
      weight: 10,
    },
    {
      id: "education",
      label: "Education or credentials",
      detail:
        resume.education.length > 0
          ? "Education is present and clearly labeled."
          : "Add a degree, certification, or relevant training.",
      status: resume.education.length > 0 ? "pass" : "warn",
      weight: 10,
    },
    {
      id: "skills",
      label: "Role-relevant skills",
      detail:
        resume.skills.length >= 5
          ? `${resume.skills.length} searchable skills are listed.`
          : "List at least 5 tools and competencies from the job description.",
      status:
        resume.skills.length >= 5
          ? "pass"
          : resume.skills.length > 0
            ? "warn"
            : "improve",
      weight: 10,
    },
    {
      id: "links",
      label: "Portfolio or LinkedIn",
      detail:
        filled(resume.website) || filled(resume.linkedin)
          ? "A portfolio link adds useful context for reviewers."
          : "Add a portfolio or LinkedIn URL.",
      status:
        filled(resume.website) || filled(resume.linkedin) ? "pass" : "warn",
      weight: 5,
    },
    {
      id: "length",
      label: "Scannable length",
      detail:
        words > 0 && words <= 750
          ? `${words} words — concise enough for a hiring manager's first pass.`
          : words === 0
            ? "Start adding content to see a length recommendation."
            : "Consider trimming to under 750 words for a focused one-page resume.",
      status:
        words > 0 && words <= 750 ? "pass" : words === 0 ? "warn" : "warn",
      weight: 10,
    },
  ];

  const earned = checks.reduce((total, check) => {
    if (check.status === "pass") return total + check.weight;
    if (check.status === "warn") return total + check.weight * 0.5;
    return total;
  }, 0);
  const possible = checks.reduce((total, check) => total + check.weight, 0);
  const score = Math.round((earned / possible) * 100);
  const passed = checks.filter((check) => check.status === "pass").length;

  return { score, checks, passed, total: checks.length };
}
