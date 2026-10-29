import { z } from "zod";

const month = z
  .string()
  .max(7)
  .regex(/^$|^\d{4}-(0[1-9]|1[0-2])$/, "Use the YYYY-MM format.");

const shortText = (max: number) => z.string().max(max);
const optionalUrl = z.string().max(240);
const accentSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color.");
const templateSchema = z.enum(["modern", "executive"]);

const experienceSchema = z
  .object({
    id: z.string().uuid(),
    role: shortText(120),
    company: shortText(120),
    location: shortText(120),
    startDate: month,
    endDate: month,
    current: z.boolean(),
    highlights: z.array(z.string().max(600)).max(20),
  })
  .strict();

const educationSchema = z
  .object({
    id: z.string().uuid(),
    school: shortText(160),
    degree: shortText(120),
    field: shortText(120),
    location: shortText(120),
    startDate: month,
    endDate: month,
    current: z.boolean(),
    details: z.string().max(600),
  })
  .strict();

const projectSchema = z
  .object({
    id: z.string().uuid(),
    name: shortText(140),
    link: optionalUrl,
    description: z.string().max(800),
  })
  .strict();

/**
 * Validates full and partial resume writes. Text is intentionally not
 * format-restricted beyond size so autosave never interrupts typing; the ATS
 * panel surfaces contact-quality suggestions instead.
 */
export const resumeContentSchema = z
  .object({
    title: z.string().max(140),
    template: templateSchema,
    accent: accentSchema,
    fullName: shortText(120),
    headline: shortText(160),
    email: shortText(200),
    phone: shortText(60),
    location: shortText(160),
    website: optionalUrl,
    linkedin: optionalUrl,
    summary: z.string().max(2000),
    experience: z.array(experienceSchema).max(20),
    education: z.array(educationSchema).max(10),
    skills: z
      .array(z.string().trim().min(1).max(44))
      .max(40)
      .transform((skills) => Array.from(new Set(skills))),
    projects: z.array(projectSchema).max(12),
  })
  .strict();

export const resumeUpdateSchema = z
  .object({
    title: z.string().max(140),
    template: templateSchema,
    accent: accentSchema,
    fullName: shortText(120),
    headline: shortText(160),
    email: shortText(200),
    phone: shortText(60),
    location: shortText(160),
    website: optionalUrl,
    linkedin: optionalUrl,
    summary: z.string().max(2000),
    experience: z.array(experienceSchema).max(20),
    education: z.array(educationSchema).max(10),
    skills: z
      .array(z.string().trim().min(1).max(44))
      .max(40)
      .transform((skills) => Array.from(new Set(skills))),
    projects: z.array(projectSchema).max(12),
  })
  .partial()
  .strict();

export type ResumeUpdate = z.infer<typeof resumeUpdateSchema>;

export function formatZodError(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "resume";
    if (!fieldErrors[path]) fieldErrors[path] = issue.message;
  }
  return fieldErrors;
}
