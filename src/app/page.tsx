import type { Metadata } from "next";
import { ResumeStudio } from "@/components/resume-studio";

export const metadata: Metadata = {
  title: "Vellum — The calm resume studio",
};

export default function HomePage() {
  return <ResumeStudio />;
}
