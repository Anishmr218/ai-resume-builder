/**
 * Errors raised by the Groq integration. `HttpError` handling knows how to
 * turn these into the same JSON envelope used by the rest of the API.
 */
export class AiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface UpstreamErrorShape {
  status?: unknown;
  code?: unknown;
  message?: unknown;
  name?: unknown;
  error?: unknown;
}

function nestedErrorValue(
  value: unknown,
  field: "message" | "code" | "type",
): string | null {
  if (!value || typeof value !== "object") return null;
  const candidate = (value as Record<string, unknown>)[field];
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
}

function statusFromMessage(message: string): number | null {
  const match = /(?:^|\s|\[)(?:HTTP\s*)?(4\d{2}|5\d{2})(?:\s|\]|:)/.exec(
    message,
  );
  return match?.[1] ? Number(match[1]) : null;
}

/**
 * Map SDK/transport failures to stable codes the UI can explain. Groq error
 * payloads can arrive as an `APIError` or as a plain object, so classify on
 * both the status/code and the human-readable message.
 */
export function classifyGroqError(error: unknown): AiError {
  if (error instanceof AiError) return error;

  const shape =
    error && typeof error === "object" ? (error as UpstreamErrorShape) : {};
  const nestedMessage = nestedErrorValue(shape.error, "message");
  const nestedCode = nestedErrorValue(shape.error, "code");
  const nestedType = nestedErrorValue(shape.error, "type");
  const message =
    nestedMessage ||
    (typeof shape.message === "string"
      ? shape.message
      : error instanceof Error
        ? error.message
        : "Unknown Groq error");
  const name = typeof shape.name === "string" ? shape.name : "";
  const code =
    nestedCode ||
    (typeof shape.code === "string" ? shape.code : "") ||
    nestedType ||
    "";
  const rawStatus =
    typeof shape.status === "number"
      ? shape.status
      : typeof shape.status === "string" && /^\d{3}$/.test(shape.status)
        ? Number(shape.status)
        : statusFromMessage(message);
  const status = rawStatus ?? null;

  if (
    name === "AbortError" ||
    name === "APIUserAbortError" ||
    name === "APIConnectionTimeoutError" ||
    name === "TimeoutError" ||
    /timed?\s*out|timeout|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT/i.test(message)
  ) {
    return new AiError(
      504,
      "AI_TIMEOUT",
      "Groq took too long to respond. Please try again.",
    );
  }

  if (
    status === 429 ||
    /rate[\s_-]?limit|too many requests|quota|tokens per minute|TPM|RPD/i.test(
      message,
    ) ||
    /rate_limit_exceeded/i.test(code)
  ) {
    return new AiError(
      429,
      "AI_RATE_LIMITED",
      "Groq is rate-limiting requests right now. Wait a moment, then try again.",
      { retryable: true },
    );
  }

  if (
    status === 401 ||
    status === 403 ||
    /invalid[_ ]?api[_ ]?key|invalid api key|authentication|unauthorized|permission denied/i.test(
      message,
    ) ||
    /invalid_api_key|authentication_error|permission_denied/i.test(code)
  ) {
    return new AiError(
      502,
      "AI_KEY_INVALID",
      "Groq rejected the configured API key. Check GROQ_API_KEY and restart the app.",
    );
  }

  if (
    status === 404 ||
    /model.*(?:not found|not supported|does not exist|decommissioned|no longer available)|is not found/i.test(
      message,
    ) ||
    /model_not_found|model_decommissioned/i.test(code)
  ) {
    return new AiError(
      502,
      "AI_MODEL_UNAVAILABLE",
      "The configured Groq model is unavailable. Set GROQ_MODEL to a model your API key can access.",
    );
  }

  if (
    /content[_ ]policy|safety|blocked|moderation|violat/i.test(message) ||
    /content_policy_violation/i.test(code)
  ) {
    return new AiError(
      502,
      "AI_CONTENT_BLOCKED",
      "Groq declined to generate this content. Try rewording your input.",
    );
  }

  if (status !== null && status >= 400 && status < 500) {
    return new AiError(
      status === 400 || status === 413 || status === 422 ? 422 : 502,
      "AI_REQUEST_REJECTED",
      "Groq could not process this request. Check the input and try again.",
    );
  }

  return new AiError(
    502,
    "AI_UPSTREAM_ERROR",
    "Groq is unavailable right now. Please try again.",
    { retryable: true },
  );
}
