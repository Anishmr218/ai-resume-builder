import { describe, expect, it } from "vitest";
import {
  enhanceBulletRequestSchema,
  enhanceBulletResponseSchema,
  generateSummaryRequestSchema,
  matchJobRequestSchema,
  matchJobResponseSchema,
  normalizeSkillGroups,
  suggestSkillsRequestSchema,
} from "@/lib/ai/schemas";
import { AiError, classifyGroqError } from "@/lib/ai/errors";
import { createSampleResume } from "@/lib/resume/sample";

describe("AI request validation", () => {
  it("trims a bullet and accepts an optional target title", () => {
    const parsed = enhanceBulletRequestSchema.parse({
      bullet: "  Led a redesign that increased activation by 34%.  ",
      targetTitle: "  Senior Product Designer  ",
    });

    expect(parsed.bullet).toBe(
      "Led a redesign that increased activation by 34%.",
    );
    expect(parsed.targetTitle).toBe("Senior Product Designer");
  });

  it("rejects short draft bullets and oversized summaries", () => {
    expect(
      enhanceBulletRequestSchema.safeParse({ bullet: "Worked" }).success,
    ).toBe(false);
    expect(
      generateSummaryRequestSchema.safeParse({
        targetTitle: "Designer",
        skills: Array.from({ length: 41 }, (_item, index) => `Skill ${index}`),
        experience: [],
      }).success,
    ).toBe(false);
  });

  it("accepts a full resume for job matching and rejects short postings", () => {
    const parsed = matchJobRequestSchema.safeParse({
      resume: createSampleResume(),
      jobDescription:
        "We are hiring a senior product designer to lead end-to-end experiences for our fintech platform.",
    });
    expect(parsed.success).toBe(true);

    expect(
      matchJobRequestSchema.safeParse({
        resume: createSampleResume(),
        jobDescription: "Designer wanted",
      }).success,
    ).toBe(false);
  });

  it("accepts a title-only skill request", () => {
    const parsed = suggestSkillsRequestSchema.parse({
      title: "  Data Analyst  ",
      industry: " Healthcare ",
    });
    expect(parsed).toEqual({
      title: "Data Analyst",
      industry: "Healthcare",
    });
  });
});

describe("AI response validation", () => {
  it("requires exactly three bullet variations", () => {
    expect(
      enhanceBulletResponseSchema.safeParse({
        variations: ["One strong bullet", "Two strong bullet"],
      }).success,
    ).toBe(false);
    expect(
      enhanceBulletResponseSchema.safeParse({
        variations: [
          "Led a redesign that increased activation by a verified 34%.",
          "Reduced support contacts by 22% by rebuilding the help center.",
          "Aligned six product teams around one shared design system.",
        ],
      }).success,
    ).toBe(true);
  });

  it("requires exactly three match suggestions and clamps keyword duplicates", () => {
    const parsed = matchJobResponseSchema.parse({
      score: 73,
      missingKeywords: ["Figma", "figma", "Design Systems", "Figma"],
      suggestions: [
        "Add design systems work to your Northwind bullet.",
        "Mention Figma explicitly in your skills section.",
        "Mirror the posting's accessibility language in your summary.",
      ],
    });

    expect(parsed.missingKeywords).toEqual(["Figma", "Design Systems"]);

    expect(
      matchJobResponseSchema.safeParse({
        score: 73,
        missingKeywords: [],
        suggestions: ["Only one"],
      }).success,
    ).toBe(false);
  });
});

describe("skill normalization", () => {
  it("deduplicates across categories and trims long tags", () => {
    const normalized = normalizeSkillGroups({
      technical: ["Product Strategy", "Figma", "A".repeat(60)],
      tools: ["Figma", "Jira", "Notion"],
      softSkills: ["Mentoring", "product strategy", "Facilitation"],
    });

    expect(normalized.technical).toEqual(["Product Strategy", "Figma", "A".repeat(44)]);
    expect(normalized.tools).toEqual(["Jira", "Notion"]);
    expect(normalized.softSkills).toEqual(["Mentoring", "Facilitation"]);
  });
});

describe("Groq error classification", () => {
  it("maps quota failures to a clear rate-limit error", () => {
    const error = classifyGroqError({
      status: 429,
      message: "Rate limit reached for model",
      error: { code: "rate_limit_exceeded", message: "Rate limit reached" },
    });
    expect(error.code).toBe("AI_RATE_LIMITED");
    expect(error.status).toBe(429);
  });

  it("maps invalid API keys separately from transient failures", () => {
    const error = classifyGroqError({
      status: 401,
      error: { code: "invalid_api_key", message: "Invalid API Key" },
    });
    expect(error.code).toBe("AI_KEY_INVALID");
    expect(error.status).toBe(502);
  });

  it("maps unavailable models to a configuration error", () => {
    const error = classifyGroqError({
      status: 404,
      error: {
        code: "model_not_found",
        message: "The model `llama-3.3-70b-versatile` does not exist",
      },
    });
    expect(error.code).toBe("AI_MODEL_UNAVAILABLE");
    expect(error.status).toBe(502);
  });

  it("maps aborts and timeouts to AI_TIMEOUT", () => {
    const abort = new Error("The operation was aborted");
    abort.name = "AbortError";
    expect(classifyGroqError(abort).code).toBe("AI_TIMEOUT");
  });

  it("preserves an AiError instance", () => {
    const original = new AiError(503, "AI_NOT_CONFIGURED", "Missing key");
    expect(classifyGroqError(original)).toBe(original);
  });
});
