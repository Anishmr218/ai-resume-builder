export const TEMPLATES = [
  {
    id: "modern",
    name: "Modern",
    fullName: "Modern Minimalist",
    description: "Clean, contemporary, and quietly confident.",
  },
  {
    id: "executive",
    name: "Executive",
    fullName: "Executive Classic",
    description: "Timeless serif typography with an editorial feel.",
  },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const ACCENTS = [
  { name: "Forest", value: "#1F513E" },
  { name: "Ink", value: "#1E2A3A" },
  { name: "Oxblood", value: "#7A2E3A" },
  { name: "Ochre", value: "#96682C" },
  { name: "Cobalt", value: "#274C77" },
] as const;

export const DEFAULT_ACCENT = ACCENTS[0].value;
export const DEFAULT_TEMPLATE: TemplateId = "modern";

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  details: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  link: string;
  description: string;
}

export interface Resume {
  id: string;
  title: string;
  template: TemplateId;
  accent: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[];
  createdAt?: string;
  updatedAt?: string;
}

/** The editable portion of a resume (everything except identity and timestamps). */
export type ResumeContent = Omit<
  Resume,
  "id" | "createdAt" | "updatedAt"
>;

export type ResumeSummary = {
  id: string;
  title: string;
  template: TemplateId;
  accent: string;
  fullName: string;
  updatedAt: string;
};

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarKey: string | null;
}

export interface PublicUser extends User {
  avatarUrl: string | null;
}

export interface BootstrapPayload {
  user: PublicUser;
  resume: Resume;
  /** True only when the workspace was just created with sample content. */
  isSample: boolean;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
