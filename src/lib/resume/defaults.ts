import {
  DEFAULT_ACCENT,
  DEFAULT_TEMPLATE,
  type ResumeContent,
} from "./types";

export function createEmptyResume(): ResumeContent {
  return {
    title: "Untitled resume",
    template: DEFAULT_TEMPLATE,
    accent: DEFAULT_ACCENT,
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
  };
}
