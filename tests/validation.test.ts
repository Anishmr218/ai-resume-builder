import { describe, expect, it } from "vitest";
import { createSampleResume } from "@/lib/resume/sample";
import { resumeContentSchema, resumeUpdateSchema } from "@/lib/resume/validation";

describe("resume validation", () => {
  it("accepts the sample resume", () => {
    expect(resumeContentSchema.safeParse(createSampleResume()).success).toBe(
      true,
    );
  });

  it("rejects malformed dates and template ids", () => {
    const resume = createSampleResume();
    const result = resumeContentSchema.safeParse({
      ...resume,
      template: "creative",
      experience: resume.experience.map((entry) => ({
        ...entry,
        startDate: "March 2022",
      })),
    });
    expect(result.success).toBe(false);
  });

  it("supports partial updates for autosave", () => {
    const result = resumeUpdateSchema.safeParse({ fullName: "Jordan Vale" });
    expect(result.success).toBe(true);
  });

  it("normalizes duplicate skills", () => {
    const resume = createSampleResume();
    const result = resumeContentSchema.parse({
      ...resume,
      skills: ["Figma", "Figma", "Research"],
    });
    expect(result.skills).toEqual(["Figma", "Research"]);
  });

  it("rejects prototype pollution keys via strict objects", () => {
    const result = resumeUpdateSchema.safeParse({ __proto__: { admin: true } });
    expect(result.success).toBe(false);
  });
});
