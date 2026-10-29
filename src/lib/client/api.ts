import type {
  EnhanceBulletRequest,
  EnhanceBulletResponse,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  MatchJobResponse,
  SuggestSkillsRequest,
  SuggestSkillsResponse,
} from "@/lib/ai/types";
import type {
  BootstrapPayload,
  PublicUser,
  Resume,
  ResumeContent,
} from "@/lib/resume/types";

export interface ExportResult {
  url: string;
  key: string;
  fileName: string;
  bytes: number;
  expiresIn: number;
  storage: "s3" | "local";
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get fallbackUrl(): string | null {
    if (
      this.details &&
      typeof this.details === "object" &&
      "fallbackUrl" in this.details &&
      typeof (this.details as { fallbackUrl?: unknown }).fallbackUrl === "string"
    ) {
      return (this.details as { fallbackUrl: string }).fallbackUrl;
    }
    return null;
  }
}

async function toApiError(response: Response): Promise<ApiRequestError> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON error from a proxy or host.
  }

  const body = payload as
    | { error?: { code?: string; message?: string; details?: unknown } }
    | null;

  return new ApiRequestError(
    response.status,
    body?.error?.code ?? "REQUEST_FAILED",
    body?.error?.message ??
      `The request could not be completed (HTTP ${response.status}).`,
    body?.error?.details,
  );
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiRequestError(
      0,
      "NETWORK_ERROR",
      "We couldn't reach the server. Check your connection and try again.",
    );
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function resumeContentFrom(resume: Resume): ResumeContent {
  return {
    title: resume.title,
    template: resume.template,
    accent: resume.accent,
    fullName: resume.fullName,
    headline: resume.headline,
    email: resume.email,
    phone: resume.phone,
    location: resume.location,
    website: resume.website,
    linkedin: resume.linkedin,
    summary: resume.summary,
    experience: resume.experience,
    education: resume.education,
    skills: resume.skills,
    projects: resume.projects,
  };
}

export const api = {
  bootstrap(): Promise<BootstrapPayload> {
    return request<BootstrapPayload>("/api/session", { method: "POST" });
  },

  updateResume(
    id: string,
    content: ResumeContent,
  ): Promise<{ resume: Resume }> {
    return request<{ resume: Resume }>(`/api/resumes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(content),
    });
  },

  async downloadPdf(
    id: string,
  ): Promise<{ blob: Blob; fileName: string }> {
    let response: Response;
    try {
      response = await fetch(`/api/resumes/${id}/pdf`, {
        method: "POST",
        cache: "no-store",
        headers: { Accept: "application/pdf" },
      });
    } catch {
      throw new ApiRequestError(
        0,
        "NETWORK_ERROR",
        "The PDF could not be generated. Check your connection and try again.",
      );
    }

    if (!response.ok) throw await toApiError(response);

    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = /filename="([^"]+)"/.exec(disposition);
    return {
      blob: await response.blob(),
      fileName: match?.[1] ?? "resume.pdf",
    };
  },

  exportResume(id: string): Promise<ExportResult> {
    return request<ExportResult>(`/api/resumes/${id}/export`, {
      method: "POST",
    });
  },

  uploadAvatar(file: File): Promise<{ user: PublicUser }> {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ user: PublicUser }>("/api/users/me/avatar", {
      method: "POST",
      body: formData,
    });
  },

  deleteAvatar(): Promise<{ user: PublicUser }> {
    return request<{ user: PublicUser }>("/api/users/me/avatar", {
      method: "DELETE",
    });
  },

  enhanceBullet(input: EnhanceBulletRequest): Promise<EnhanceBulletResponse> {
    return request<EnhanceBulletResponse>("/api/ai/enhance-bullet", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  generateSummary(
    input: GenerateSummaryRequest,
  ): Promise<GenerateSummaryResponse> {
    return request<GenerateSummaryResponse>("/api/ai/generate-summary", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  matchJob(resume: Resume, jobDescription: string): Promise<MatchJobResponse> {
    return request<MatchJobResponse>("/api/ai/match-job", {
      method: "POST",
      body: JSON.stringify({
        resume: resumeContentFrom(resume),
        jobDescription,
      }),
    });
  },

  suggestSkills(
    input: SuggestSkillsRequest,
  ): Promise<SuggestSkillsResponse> {
    return request<SuggestSkillsResponse>("/api/ai/suggest-skills", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
