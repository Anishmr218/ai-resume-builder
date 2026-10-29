"use client";

import * as React from "react";
import { toast } from "sonner";
import { ApiRequestError, api, resumeContentFrom } from "@/lib/client/api";
import { createEmptyResume } from "@/lib/resume/defaults";
import type { PublicUser, Resume } from "@/lib/resume/types";

export type LoadStatus = "loading" | "ready" | "error";
export type SaveState = "idle" | "saved" | "dirty" | "saving" | "error";

interface ResumeStore {
  status: LoadStatus;
  error: string | null;
  user: PublicUser | null;
  resume: Resume | null;
  isSample: boolean;
  saveState: SaveState;
  saveError: string | null;
  lastSavedAt: string | null;
  mutate: (updater: (resume: Resume) => Resume) => void;
  saveNow: () => Promise<boolean>;
  retrySave: () => void;
  retryBootstrap: () => Promise<void>;
  startFresh: () => Promise<boolean>;
  dismissSample: () => void;
  updateUser: (user: PublicUser) => void;
}

const ResumeStoreContext = React.createContext<ResumeStore | null>(null);
const AUTOSAVE_DELAY = 900;
const SAMPLE_KEY = (resumeId: string) => `vellum:sample-dismissed:${resumeId}`;

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing / storage disabled — non-fatal.
  }
}

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<LoadStatus>("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<PublicUser | null>(null);
  const [resume, setResumeState] = React.useState<Resume | null>(null);
  const [isSample, setIsSample] = React.useState(false);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);

  const resumeRef = React.useRef<Resume | null>(null);
  const mountedRef = React.useRef(false);
  const bootStartedRef = React.useRef(false);
  const revisionRef = React.useRef(0);
  const savedRevisionRef = React.useRef(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = React.useRef(false);
  const saveStateRef = React.useRef<SaveState>("idle");
  const scheduleRef = React.useRef<(delay?: number) => void>(() => undefined);
  const persistRef = React.useRef<() => Promise<boolean>>(async () => false);

  const applySaveState = React.useCallback((next: SaveState) => {
    saveStateRef.current = next;
    setSaveState(next);
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const persist = React.useCallback(async (): Promise<boolean> => {
    const current = resumeRef.current;
    if (!current || inFlightRef.current) return false;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const revisionAtStart = revisionRef.current;
    inFlightRef.current = true;
    applySaveState("saving");
    setSaveError(null);
    let followUp = false;

    try {
      const { resume: saved } = await api.updateResume(
        current.id,
        resumeContentFrom(current),
      );
      if (!mountedRef.current) return true;

      toast.dismiss("save-error");
      savedRevisionRef.current = revisionAtStart;

      if (revisionAtStart === revisionRef.current) {
        resumeRef.current = saved;
        setResumeState(saved);
        setLastSavedAt(saved.updatedAt ?? new Date().toISOString());
        applySaveState("saved");
      } else {
        followUp = true;
        applySaveState("dirty");
      }

      return true;
    } catch (caught) {
      if (!mountedRef.current) return false;
      const message =
        caught instanceof ApiRequestError
          ? caught.message
          : "Your latest changes could not be saved. Please try again.";
      setSaveError(message);
      applySaveState("error");
      toast.error("Changes aren't saved yet", {
        id: "save-error",
        description: message,
        duration: 6500,
      });
      return false;
    } finally {
      inFlightRef.current = false;
      if (followUp && mountedRef.current) {
        scheduleRef.current(250);
      }
    }
  }, [applySaveState]);

  persistRef.current = persist;

  const schedule = React.useCallback((delay = AUTOSAVE_DELAY) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void persistRef.current();
    }, delay);
  }, []);

  scheduleRef.current = schedule;

  const bootstrap = React.useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const payload = await api.bootstrap();
      if (!mountedRef.current) return;

      resumeRef.current = payload.resume;
      setResumeState(payload.resume);
      setUser(payload.user);
      setLastSavedAt(payload.resume.updatedAt ?? new Date().toISOString());
      revisionRef.current = 0;
      savedRevisionRef.current = 0;
      applySaveState("saved");

      const dismissed =
        safeGetItem(SAMPLE_KEY(payload.resume.id)) === "true";
      setIsSample(payload.isSample && !dismissed);
      setStatus("ready");
    } catch (caught) {
      if (!mountedRef.current) return;
      const message =
        caught instanceof ApiRequestError
          ? caught.message
          : "We couldn't open your workspace. Please try again.";
      setError(message);
      setStatus("error");
      console.error("[vellum] Bootstrap failed", caught);
    }
  }, [applySaveState]);

  React.useEffect(() => {
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;
    void bootstrap();
  }, [bootstrap]);

  const retryBootstrap = React.useCallback(async () => {
    await bootstrap();
  }, [bootstrap]);

  const mutate = React.useCallback(
    (updater: (current: Resume) => Resume) => {
      const current = resumeRef.current;
      if (!current) return;

      const next = updater(current);
      if (next === current) return;

      resumeRef.current = next;
      setResumeState(next);
      revisionRef.current += 1;
      setSaveError(null);
      applySaveState("dirty");
      scheduleRef.current();
    },
    [applySaveState],
  );

  const saveNow = React.useCallback(async (): Promise<boolean> => {
    if (!resumeRef.current) return false;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (inFlightRef.current) {
      scheduleRef.current(150);
      return false;
    }

    if (
      saveStateRef.current === "saved" &&
      savedRevisionRef.current === revisionRef.current
    ) {
      return true;
    }

    return persistRef.current();
  }, []);

  const retrySave = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!inFlightRef.current) {
      void persistRef.current();
    }
  }, []);

  const startFresh = React.useCallback(async (): Promise<boolean> => {
    const current = resumeRef.current;
    if (!current) return false;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const blank = createEmptyResume();
    const next: Resume = {
      ...current,
      ...blank,
      // Keep the user's design choices while clearing their content.
      template: current.template,
      accent: current.accent,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    resumeRef.current = next;
    setResumeState(next);
    revisionRef.current += 1;
    setIsSample(false);
    setSaveError(null);
    safeSetItem(SAMPLE_KEY(current.id), "true");
    applySaveState("dirty");

    const saved = await persistRef.current();
    if (saved) {
      toast.success("A fresh page, ready for you", {
        description: "Your sample content has been cleared.",
      });
    }
    return saved;
  }, [applySaveState]);

  const dismissSample = React.useCallback(() => {
    const current = resumeRef.current;
    setIsSample(false);
    if (current) safeSetItem(SAMPLE_KEY(current.id), "true");
  }, []);

  const updateUser = React.useCallback((nextUser: PublicUser) => {
    setUser(nextUser);
  }, []);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (["dirty", "saving", "error"].includes(saveStateRef.current)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const value = React.useMemo<ResumeStore>(
    () => ({
      status,
      error,
      user,
      resume,
      isSample,
      saveState,
      saveError,
      lastSavedAt,
      mutate,
      saveNow,
      retrySave,
      retryBootstrap,
      startFresh,
      dismissSample,
      updateUser,
    }),
    [
      status,
      error,
      user,
      resume,
      isSample,
      saveState,
      saveError,
      lastSavedAt,
      mutate,
      saveNow,
      retrySave,
      retryBootstrap,
      startFresh,
      dismissSample,
      updateUser,
    ],
  );

  return (
    <ResumeStoreContext.Provider value={value}>
      {children}
    </ResumeStoreContext.Provider>
  );
}

export function useResumeStore(): ResumeStore {
  const value = React.useContext(ResumeStoreContext);
  if (!value) {
    throw new Error("useResumeStore must be used inside ResumeProvider.");
  }
  return value;
}
