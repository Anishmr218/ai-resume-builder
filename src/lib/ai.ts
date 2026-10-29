import Groq from "groq-sdk";
import type { z } from "zod";
import { AiError, classifyGroqError } from "@/lib/ai/errors";
import {
  buildEnhanceBulletPrompt,
  buildGenerateSummaryPrompt,
  buildMatchJobPrompt,
  buildSuggestSkillsPrompt,
  enhanceBulletSystemInstruction,
  generateSummarySystemInstruction,
  matchJobSystemInstruction,
  suggestSkillsSystemInstruction,
} from "@/lib/ai/prompts";
import {
  enhanceBulletJsonSchema,
  generateSummaryJsonSchema,
  matchJobJsonSchema,
  suggestSkillsJsonSchema,
} from "@/lib/ai/json-schemas";
import {
  enhanceBulletResponseSchema,
  generateSummaryResponseSchema,
  matchJobResponseSchema,
  normalizeSkillGroups,
  suggestSkillsResponseSchema,
  type EnhanceBulletInput,
  type GenerateSummaryInput,
  type MatchJobInput,
  type SuggestSkillsInput,
} from "@/lib/ai/schemas";
import type {
  EnhanceBulletResponse,
  GenerateSummaryResponse,
  MatchJobResponse,
  SuggestSkillsResponse,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "openai/gpt-oss-20b";
const REQUEST_TIMEOUT_MS = 45_000;
const PLACEHOLDER_KEYS = new Set([
  "your_groq_api_key_here",
  "your_groq_key_here",
  "replace-with-your-groq-key",
]);

let cachedClient: {
  key: string;
  client: Groq;
} | null = null;

export function getGroqModelName(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

function getClient(): Groq {
  const key = process.env.GROQ_API_KEY?.trim();

  if (!key || PLACEHOLDER_KEYS.has(key)) {
    throw new AiError(
      503,
      "AI_NOT_CONFIGURED",
      "AI features need a Groq API key. Add GROQ_API_KEY to your environment, then restart the app.",
      { envVar: "GROQ_API_KEY" },
    );
  }

  // A Gemini key is not valid for Groq. Catch this common migration mistake
  // before making a network request so the fix is unambiguous.
  if (key.startsWith("AQ.")) {
    throw new AiError(
      503,
      "AI_NOT_CONFIGURED",
      "GROQ_API_KEY looks like a Google Gemini key. Replace it with a Groq API key from https://console.groq.com/keys, then restart the app.",
      { envVar: "GROQ_API_KEY" },
    );
  }

  if (!cachedClient || cachedClient.key !== key) {
    cachedClient = {
      key,
      client: new Groq({
        apiKey: key,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: 0,
      }),
    };
  }

  return cachedClient.client;
}

function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(withoutFence.slice(start, end + 1));
      } catch {
        // Fall through to a typed error.
      }
    }
    throw new AiError(
      502,
      "AI_BAD_RESPONSE",
      "Groq returned a response we couldn't read. Please try again.",
    );
  }
}

function buildJsonSystemInstruction(
  systemInstruction: string,
  schemaName: string,
  jsonSchema: Record<string, unknown>,
): string {
  return `${systemInstruction}

Return only a valid JSON object that conforms to this JSON Schema. Put the required fields directly at the top level of the object. Do not wrap the object in another object or key, and do not include markdown fences, commentary, or any text outside the JSON object.
JSON Schema:
${JSON.stringify(jsonSchema)}`;
}

interface GenerateJsonOptions<T> {
  prompt: string;
  systemInstruction: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  validator: z.ZodType<T>;
  temperature: number;
  maxOutputTokens: number;
}

/**
 * Some models wrap the requested object in a single envelope key, such as
 * `{ "suggest_skills": { ... } }`. Try the object as-is first, then the inner
 * value when it is a single-key object envelope.
 */
function validationCandidates(parsed: unknown, schemaName: string): unknown[] {
  const candidates: unknown[] = [parsed];

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length === 1) {
      const [key, value] = entries[0];
      const isEnvelope =
        key === schemaName ||
        (value !== null && typeof value === "object" && !Array.isArray(value));
      if (isEnvelope) candidates.push(value);
    }
  }

  return candidates;
}

async function generateJson<T>({
  prompt,
  systemInstruction,
  schemaName,
  jsonSchema,
  validator,
  temperature,
  maxOutputTokens,
}: GenerateJsonOptions<T>): Promise<T> {
  let text: string;

  try {
    const completion = await getClient().chat.completions.create(
      {
        model: getGroqModelName(),
        messages: [
          {
            role: "system",
            content: buildJsonSystemInstruction(
              systemInstruction,
              schemaName,
              jsonSchema,
            ),
          },
          { role: "user", content: prompt },
        ],
        temperature,
        top_p: 0.95,
        max_completion_tokens: maxOutputTokens,
        response_format: { type: "json_object" },
        stream: false,
      },
      { timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 },
    );

    const choice = completion.choices[0];
    if (!choice) {
      throw new AiError(
        502,
        "AI_EMPTY_RESPONSE",
        "Groq returned an empty response. Please try again.",
      );
    }

    if (choice.finish_reason === "length") {
      throw new AiError(
        502,
        "AI_BAD_RESPONSE",
        "Groq's response was cut off before it finished. Please try again.",
      );
    }

    if (
      choice.finish_reason === "tool_calls" ||
      choice.finish_reason === "function_call"
    ) {
      throw new AiError(
        502,
        "AI_BAD_RESPONSE",
        "Groq returned an unexpected tool response. Please try again.",
      );
    }

    text = choice.message?.content ?? "";
  } catch (error) {
    const aiError = classifyGroqError(error);
    console.warn("[vellum] Groq request failed", {
      code: aiError.code,
      status: aiError.status,
    });
    throw aiError;
  }

  if (!text.trim()) {
    throw new AiError(
      502,
      "AI_EMPTY_RESPONSE",
      "Groq returned an empty response. Please try again.",
    );
  }

  const parsed = parseModelJson(text);
  const candidates = validationCandidates(parsed, schemaName);
  let validated = validator.safeParse(candidates[0]);

  for (
    let index = 1;
    index < candidates.length && !validated.success;
    index += 1
  ) {
    validated = validator.safeParse(candidates[index]);
  }

  if (!validated.success) {
    console.warn("[vellum] Groq response failed validation", {
      issues: validated.error.issues.map((issue) => issue.path.join(".")),
    });
    throw new AiError(
      502,
      "AI_BAD_RESPONSE",
      "Groq returned a response that didn't match the expected format. Please try again.",
    );
  }

  return validated.data;
}

function cleanBullet(value: string): string {
  return value
    .trim()
    .replace(/^[-•*–—]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\s+/g, " ");
}

function cleanSummary(value: string): string {
  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ");
}

function cleanKeyword(value: string): string {
  return value
    .trim()
    .replace(/^[-•*–—]\s+/, "")
    .replace(/\s+/g, " ");
}

export async function enhanceBullet(
  input: EnhanceBulletInput,
): Promise<EnhanceBulletResponse> {
  const data = await generateJson({
    prompt: buildEnhanceBulletPrompt(input),
    systemInstruction: enhanceBulletSystemInstruction,
    schemaName: "enhance_bullet",
    jsonSchema: enhanceBulletJsonSchema,
    validator: enhanceBulletResponseSchema,
    temperature: 0.7,
    maxOutputTokens: 2_048,
  });

  const variations = data.variations.map(cleanBullet).filter(Boolean);

  if (variations.length !== 3) {
    throw new AiError(
      502,
      "AI_BAD_RESPONSE",
      "Groq didn't return three complete variations. Please try again.",
    );
  }

  return { variations };
}

export async function generateSummary(
  input: GenerateSummaryInput,
): Promise<GenerateSummaryResponse> {
  const data = await generateJson({
    prompt: buildGenerateSummaryPrompt(input),
    systemInstruction: generateSummarySystemInstruction,
    schemaName: "generate_summary",
    jsonSchema: generateSummaryJsonSchema,
    validator: generateSummaryResponseSchema,
    temperature: 0.55,
    maxOutputTokens: 1_500,
  });

  return { summary: cleanSummary(data.summary) };
}

export async function matchJob(
  input: MatchJobInput,
): Promise<MatchJobResponse> {
  const data = await generateJson({
    prompt: buildMatchJobPrompt(input),
    systemInstruction: matchJobSystemInstruction,
    schemaName: "match_job",
    jsonSchema: matchJobJsonSchema,
    validator: matchJobResponseSchema,
    temperature: 0.25,
    maxOutputTokens: 3_000,
  });

  return {
    score: Math.max(0, Math.min(100, Math.round(data.score))),
    missingKeywords: data.missingKeywords.map(cleanKeyword).filter(Boolean),
    suggestions: data.suggestions.map((suggestion) => suggestion.trim()),
  };
}

export async function suggestSkills(
  input: SuggestSkillsInput,
): Promise<SuggestSkillsResponse> {
  const data = await generateJson({
    prompt: buildSuggestSkillsPrompt(input),
    systemInstruction: suggestSkillsSystemInstruction,
    schemaName: "suggest_skills",
    jsonSchema: suggestSkillsJsonSchema,
    validator: suggestSkillsResponseSchema,
    temperature: 0.6,
    maxOutputTokens: 1_800,
  });

  return normalizeSkillGroups(data);
}
