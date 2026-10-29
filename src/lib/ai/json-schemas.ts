/**
 * JSON Schema descriptions sent to Groq in the system prompt. The configured
 * Groq model supports JSON Object Mode rather than constrained JSON Schema
 * output, so the schema guides generation and the Zod response schemas in
 * `schemas.ts` remain the source of truth.
 */
export const enhanceBulletJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    variations: {
      type: "array",
      description:
        "Exactly three distinct, ready-to-edit resume bullet variations.",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "string",
        description:
          "One achievement bullet of 18–40 words beginning with a strong action verb.",
      },
    },
  },
  required: ["variations"],
} as const;

export const generateSummaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description:
        "A three-sentence executive summary of 55–90 words, with no first-person pronouns.",
    },
  },
  required: ["summary"],
} as const;

export const matchJobJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "Estimated overall alignment from 0 to 100. Be calibrated; 90+ requires exceptional alignment.",
    },
    missingKeywords: {
      type: "array",
      description:
        "Five to twelve important ATS keywords or short phrases from the job description that are absent or weak in the resume.",
      maxItems: 15,
      items: { type: "string" },
    },
    suggestions: {
      type: "array",
      description:
        "Exactly three concrete, prioritized edits that would improve alignment.",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
  },
  required: ["score", "missingKeywords", "suggestions"],
} as const;

export const suggestSkillsJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    technical: {
      type: "array",
      description:
        "Six domain-specific technical or hard skills, each one to four words.",
      minItems: 3,
      maxItems: 10,
      items: { type: "string" },
    },
    tools: {
      type: "array",
      description:
        "Six software platforms, tools, or technologies, each one to four words.",
      minItems: 3,
      maxItems: 10,
      items: { type: "string" },
    },
    softSkills: {
      type: "array",
      description:
        "Six interpersonal or leadership skills, each one to four words.",
      minItems: 3,
      maxItems: 10,
      items: { type: "string" },
    },
  },
  required: ["technical", "tools", "softSkills"],
} as const;
