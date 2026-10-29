/**
 * AI request/response contracts shared by the API routes and server helpers.
 * Keep this module free of Groq and Next.js imports so it can be unit tested.
 */
import { z } from "zod";
import { resumeContentSchema } from "@/lib/resume/validation";
import type { SuggestSkillsResponse } from "@/lib/ai/types";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalTitle = z
  .string()
  .trim()
  .max(160, "Target title must be 160 characters or fewer.")
  .optional();

const aiExperienceSchema = z.object({
  role: z.string().trim().max(120),
  company: z.string().trim().max(120),
  startDate: z.string().trim().max(7).optional(),
  endDate: z.string().trim().max(7).optional(),
  current: z.boolean().optional(),
  highlights: z
    .array(z.string().trim().max(600, "Highlights must be 600 characters or fewer."))
    .max(20),
});

export const enhanceBulletRequestSchema = z.object({
  bullet: trimmed(
    8,
    600,
    "The draft bullet",
  ),
  targetTitle: optionalTitle,
});

export const generateSummaryRequestSchema = z.object({
  targetTitle: trimmed(1, 160, "The target title"),
  skills: z
    .array(z.string().trim().min(1).max(44))
    .max(40, "Send no more than 40 skills."),
  experience: z.array(aiExperienceSchema).max(20),
});

export const matchJobRequestSchema = z.object({
  resume: resumeContentSchema,
  jobDescription: trimmed(40, 20_000, "The job description"),
});

export const suggestSkillsRequestSchema = z.object({
  title: trimmed(1, 160, "The target title"),
  industry: z
    .string()
    .trim()
    .max(120, "The industry must be 120 characters or fewer.")
    .optional(),
});

const bulletVariationSchema = z
  .string()
  .trim()
  .min(15, "AI returned a bullet that was too short.")
  .max(600, "AI returned a bullet over the 600-character limit.");

export const enhanceBulletResponseSchema = z.object({
  variations: z.array(bulletVariationSchema).length(3),
});

export const generateSummaryResponseSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(40, "AI returned a summary that was too short.")
    .max(1_500, "AI returned a summary over the 1,500-character limit."),
});

export const matchJobResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  missingKeywords: z
    .array(z.string().trim().min(1).max(80))
    .max(20)
    .transform((keywords) => uniqueValues(keywords, 15)),
  suggestions: z
    .array(z.string().trim().min(10).max(400))
    .length(3, "AI must return exactly three suggestions."),
});

const skillListSchema = z
  .array(z.string().trim().min(1).max(44))
  .min(3)
  .max(12);

export const suggestSkillsResponseSchema = z.object({
  technical: skillListSchema,
  tools: skillListSchema,
  softSkills: skillListSchema,
});

function uniqueValues(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= limit) break;
  }

  return result;
}

/**
 * Prevent a skill from appearing in two categories, and keep every tag within
 * the resume's 44-character skill limit.
 */
export function normalizeSkillGroups(
  groups: SuggestSkillsResponse,
): SuggestSkillsResponse {
  const seen = new Set<string>();

  const clean = (values: string[]): string[] => {
    const result: string[] = [];
    for (const value of values) {
      const trimmedValue = value.trim().slice(0, 44);
      const key = trimmedValue.toLowerCase();
      if (!trimmedValue || seen.has(key)) continue;
      seen.add(key);
      result.push(trimmedValue);
      if (result.length >= 12) break;
    }
    return result;
  };

  return {
    technical: clean(groups.technical),
    tools: clean(groups.tools),
    softSkills: clean(groups.softSkills),
  };
}

export type EnhanceBulletInput = z.infer<typeof enhanceBulletRequestSchema>;
export type GenerateSummaryInput = z.infer<typeof generateSummaryRequestSchema>;
export type MatchJobInput = z.infer<typeof matchJobRequestSchema>;
export type SuggestSkillsInput = z.infer<typeof suggestSkillsRequestSchema>;
