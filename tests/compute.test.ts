import { describe, expect, it } from "vitest";
import {
  computeAtsReport,
  computeCompleteness,
  resumeWordCount,
} from "@/lib/resume/compute";
import { createEmptyResume } from "@/lib/resume/defaults";
import { createSampleResume } from "@/lib/resume/sample";

describe("ATS report", () => {
  it("scores the polished sample resume as interview-ready", () => {
    const report = computeAtsReport(createSampleResume());
    expect(report.score).toBe(100);
    expect(report.passed).toBe(report.total);
    expect(report.checks.every((check) => check.status === "pass")).toBe(true);
  });

  it("is honest about an empty resume", () => {
    const report = computeAtsReport(createEmptyResume());
    expect(report.score).toBeLessThan(30);
    expect(report.checks.length).toBeGreaterThan(5);
    expect(report.checks.find((check) => check.id === "contact")?.status).toBe(
      "improve",
    );
  });

  it("flags missing impact metrics but rewards quantified bullets", () => {
    const resume = createSampleResume();
    resume.experience = [
      {
        id: crypto.randomUUID(),
        role: "Designer",
        company: "Studio",
        location: "Remote",
        startDate: "2022-01",
        endDate: "",
        current: true,
        highlights: [
          "Led the redesign of the checkout flow, lifting conversion by 18%.",
          "Built a design system used by 4 squads.",
        ],
      },
    ];
    const report = computeAtsReport(resume);
    expect(report.checks.find((check) => check.id === "metrics")?.status).toBe(
      "pass",
    );
  });
});

describe("completeness", () => {
  it("reports an empty resume as just getting started", () => {
    const result = computeCompleteness(createEmptyResume());
    expect(result.percent).toBe(0);
    expect(result.label).toBe("Just getting started");
  });

  it("rates the sample resume highly", () => {
    const result = computeCompleteness(createSampleResume());
    expect(result.percent).toBeGreaterThanOrEqual(90);
    expect(result.label).toBe("Exceptional");
  });
});

describe("word count", () => {
  it("summarizes every content block", () => {
    expect(resumeWordCount(createEmptyResume())).toBe(0);
    expect(resumeWordCount(createSampleResume())).toBeGreaterThan(150);
  });
});
