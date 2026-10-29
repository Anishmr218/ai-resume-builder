import type {
  Resume,
  ResumeContent,
  ResumeSummary,
  User,
} from "@/lib/resume/types";

export interface CreateWorkspaceInput {
  tokenHash: string;
  expiresAt: Date;
  sample: ResumeContent;
}

export interface WorkspaceStore {
  readonly kind: "postgres" | "memory";
  ping(): Promise<boolean>;
  getUserBySession(tokenHash: string): Promise<User | null>;
  createWorkspace(input: CreateWorkspaceInput): Promise<{
    user: User;
    resume: Resume;
  }>;
  getLatestResume(userId: string): Promise<Resume | null>;
  listResumes(userId: string): Promise<ResumeSummary[]>;
  getResume(resumeId: string, userId: string): Promise<Resume | null>;
  createResume(userId: string, input: ResumeContent): Promise<Resume>;
  updateResume(
    resumeId: string,
    userId: string,
    input: Partial<ResumeContent>,
  ): Promise<Resume | null>;
  deleteResume(resumeId: string, userId: string): Promise<boolean>;
  updateUserAvatar(userId: string, avatarKey: string | null): Promise<User | null>;
  recordExport(input: {
    resumeId: string;
    storageKey: string;
    byteSize: number;
    contentType: string;
  }): Promise<void>;
}
