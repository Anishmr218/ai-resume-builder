"use client";

import * as React from "react";
import { ResumeDocument } from "@/lib/resume/templates/document";
import { getResumeCss } from "@/lib/resume/templates/styles";
import type { Resume } from "@/lib/resume/types";

/** A4 at 96 CSS dpi. */
export const A4_WIDTH_PX = (210 / 25.4) * 96;
export const A4_HEIGHT_PX = (297 / 25.4) * 96;

/**
 * Renders the exact export document inside a paper sheet and scales it to the
 * available width. The inner sheet keeps its true 210mm geometry so line
 * breaks match the PDF one-to-one.
 */
export function ResumeCanvas({ resume }: { resume: Resume }) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.8);
  const [sheetHeight, setSheetHeight] = React.useState(A4_HEIGHT_PX);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const width = host.clientWidth;
      if (width <= 0) return;
      setScale(Math.min(1, Math.max(0.24, width / A4_WIDTH_PX)));
      setReady(true);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const measure = () => {
      setSheetHeight(Math.max(A4_HEIGHT_PX, sheet.offsetHeight));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    // Re-measure when the document structure changes, even if the observer
    // fires before fonts settle.
    const timer = window.setTimeout(() => {
      const sheet = sheetRef.current;
      if (sheet) setSheetHeight(Math.max(A4_HEIGHT_PX, sheet.offsetHeight));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [resume.template, resume.accent]);

  const pages = Math.max(1, Math.ceil((sheetHeight - 2) / A4_HEIGHT_PX));
  const scalePercent = Math.round(scale * 100);

  return (
    <div className="w-full">
      <style dangerouslySetInnerHTML={{ __html: getResumeCss() }} />

      <div ref={hostRef} className="mx-auto w-full">
        <div
          className="mx-auto"
          style={{
            width: `${A4_WIDTH_PX * scale}px`,
            height: `${sheetHeight * scale}px`,
            maxWidth: "100%",
          }}
        >
          <div
            ref={sheetRef}
            className="paper-sheet relative origin-top-left bg-white"
            style={{
              width: `${A4_WIDTH_PX}px`,
              transform: `scale(${scale})`,
              opacity: ready ? 1 : 0,
              transition: "opacity 180ms ease-out",
            }}
          >
            <ResumeDocument resume={resume} showPlaceholder />

            {Array.from({ length: pages - 1 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 z-10"
                style={{ top: `${(index + 1) * A4_HEIGHT_PX}px` }}
              >
                <div className="border-t border-dashed border-[#c9c2b3]" />
                <span className="absolute -top-2 right-0 bg-white px-1.5 text-[7px] font-medium uppercase tracking-[0.18em] text-[#a9a294]">
                  Page {index + 2}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-3.5 flex w-full max-w-[793px] items-center justify-between gap-4 px-0.5 text-[10px] text-ink-quiet/80">
        <span className="font-medium">
          {pages === 1 ? "1 page" : `${pages} pages`}
          <span className="mx-1.5 text-ink-quiet/40">·</span>
          A4
        </span>
        <span>
          Fit to width <span className="mx-1 text-ink-quiet/40">·</span>{" "}
          {scalePercent}%
        </span>
      </div>
    </div>
  );
}
