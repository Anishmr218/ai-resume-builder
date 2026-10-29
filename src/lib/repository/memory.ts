import { randomUUID } from "node:crypto";
import type {
  Resume,
  ResumeContent,
  ResumeSummary,
  User,
} from "@/lib/resume/types";
import type { CreateWorkspaceInput, WorkspaceStore } from "./types";

interface MemorySession {
  userId: string;
  tokenHash: string;
  expiresAt: number;
}

interface MemoryRecord {
  userId: string;
  resume: Resume;
}

interface MemoryState {
  users: Map<string, User>;
  sessions: Map<string, MemorySession>;
  resumes: Map<string, MemoryRecord>;
  exports: Array<{
    resumeId: string;
    storageKey: string;
    byteSize: number;
    contentType: string;
    createdAt: string;
  }>;
}

declare global {
  // eslint-disable-next-line no-var
  var __vellumMemoryState: MemoryState | undefined;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function getState(): MemoryState {
  if (!globalThis.__vellumMemoryState) {
    globalThis.__vellumMemoryState = {
      users: new Map(),
      sessions: new Map(),
      resumes: new Map(),
      exports: [],
    };
  }
  return globalThis.__vellumMemoryState;
}

function buildResume(input: ResumeContent): Resume {
  const now = new Date().toISOString();
  return {
    ...clone(input),
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
}

export function createMemoryStore(): WorkspaceStore {
  const state = getState();

  return {
    kind: "memory",

    async ping() {
      return true;
    },

    async getUserBySession(tokenHash) {
      const session = state.sessions.get(tokenHash);
      if (!session) return null;
      if (session.expiresAt <= Date.now()) {
        state.sessions.delete(tokenHash);
        return null;
      }
      const user = state.users.get(session.userId);
      return user ? clone(user) : null;
    },

    async createWorkspace({ tokenHash, expiresAt, sample }: CreateWorkspaceInput) {
      const user: User = {
        id: randomUUID(),
        email: `guest-${randomUUID()}@vellum.local`,
        fullName: sample.fullName || "Guest",
        avatarKey: null,
      };
      const resume = buildResume(sample);
      state.users.set(user.id, clone(user));
      state.resumes.set(resume.id, { userId: user.id, resume: clone(resume) });
      state.sessions.set(tokenHash, {
        userId: user.id,
        tokenHash,
        expiresAt: expiresAt.getTime(),
      });
      return { user: clone(user), resume: clone(resume) };
    },

    async getLatestResume(userId) {
      const records = [...state.resumes.values()]
        .filter((record) => record.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.resume.updatedAt ?? 0).getTime() -
            new Date(a.resume.updatedAt ?? 0).getTime(),
        );
      return records[0] ? clone(records[0].resume) : null;
    },

    async listResumes(userId) {
      return [...state.resumes.values()]
        .filter((record) => record.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.resume.updatedAt ?? 0).getTime() -
            new Date(a.resume.updatedAt ?? 0).getTime(),
        )
        .map(
          (record): ResumeSummary => ({
            id: record.resume.id,
            title: record.resume.title,
            template: record.resume.template,
            accent: record.resume.accent,
            fullName: record.resume.fullName,
            updatedAt: record.resume.updatedAt ?? new Date().toISOString(),
          }),
        );
    },

    async getResume(resumeId, userId) {
      const record = state.resumes.get(resumeId);
      if (!record || record.userId !== userId) return null;
      return clone(record.resume);
    },

    async createResume(userId, input) {
      const resume = buildResume(input);
      state.resumes.set(resume.id, { userId, resume: clone(resume) });
      return clone(resume);
    },

    async updateResume(resumeId, userId, input) {
      const record = state.resumes.get(resumeId);
      if (!record || record.userId !== userId) return null;
      const updated: Resume = {
        ...record.resume,
        ...clone(input),
        id: record.resume.id,
        createdAt: record.resume.createdAt,
        updatedAt: new Date().toISOString(),
      };
      state.resumes.set(resumeId, { userId, resume: clone(updated) });
      return clone(updated);
    },

    async deleteResume(resumeId, userId) {
      const record = state.resumes.get(resumeId);
      if (!record || record.userId !== userId) return false;
      state.resumes.delete(resumeId);
      return true;
    },

    async updateUserAvatar(userId, avatarKey) {
      const user = state.users.get(userId);
      if (!user) return null;
      const updated = { ...user, avatarKey };
      state.users.set(userId, updated);
      return clone(updated);
    },

    async recordExport({ resumeId, storageKey, byteSize, contentType }) {
      state.exports.push({
        resumeId,
        storageKey,
        byteSize,
        contentType,
        createdAt: new Date().toISOString(),
      });
    },
  };
}
