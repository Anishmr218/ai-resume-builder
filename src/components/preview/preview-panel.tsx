"use client";

import { useResumeStore } from "@/hooks/use-resume-store";
import { PreviewToolbar } from "@/components/preview/preview-toolbar";
import { ResumeCanvas } from "@/components/preview/resume-canvas";

export function PreviewPanel() {
  const { resume } = useResumeStore();
  if (!resume) return null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#EDE9E0]">
      <PreviewToolbar />

      <div className="preview-canvas scroll-area relative flex-1 overflow-auto overscroll-contain">
        <div className="flex min-h-full justify-center px-4 py-6 sm:px-8 sm:py-8">
          <div className="w-full max-w-[793px]">
            <ResumeCanvas resume={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}
