import type { ResumeContent } from "@/lib/resume/types";

/** Compact experience shape sent to Groq — no client-only IDs. */
export interface AiExperienceInput {
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  highlights: string[];
}

export interface EnhanceBulletRequest {
  bullet: string;
  targetTitle?: string;
}

export interface EnhanceBulletResponse {
  variations: string[];
}

export interface GenerateSummaryRequest {
  targetTitle: string;
  skills: string[];
  experience: AiExperienceInput[];
}

export interface GenerateSummaryResponse {
  summary: string;
}

export interface MatchJobRequest {
  resume: ResumeContent;
  jobDescription: string;
}

export interface MatchJobResponse {
  /** Estimated alignment, 0–100. */
  score: number;
  missingKeywords: string[];
  suggestions: string[];
}

export interface SuggestSkillsRequest {
  title: string;
  industry?: string;
}

export interface SuggestSkillsResponse {
  technical: string[];
  tools: string[];
  softSkills: string[];
}
