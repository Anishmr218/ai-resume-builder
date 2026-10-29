import { ApiRequestError } from "@/lib/client/api";

const AI_ERROR_MESSAGES: Record<string, string> = {
  AI_NOT_CONFIGURED:
    "AI isn't configured yet. Add GROQ_API_KEY to your environment and restart the app.",
  AI_KEY_INVALID:
    "Groq rejected the API key. Check GROQ_API_KEY in your environment.",
  AI_RATE_LIMITED:
    "Groq is receiving too many requests. Wait a moment, then try again.",
  AI_TIMEOUT: "Groq took too long to respond. Please try again.",
  AI_MODEL_UNAVAILABLE:
    "The configured Groq model is unavailable. Check GROQ_MODEL.",
  AI_CONTENT_BLOCKED:
    "Groq declined to generate this content. Try rewording your input.",
  AI_BAD_RESPONSE:
    "Groq returned an unexpected response. Please try again.",
  AI_EMPTY_RESPONSE:
    "Groq returned an empty response. Please try again.",
  AI_REQUEST_REJECTED:
    "Groq couldn't process this request. Check your input and try again.",
  AI_UPSTREAM_ERROR:
    "Groq is unavailable right now. Please try again in a moment.",
  UNAUTHORIZED:
    "Your workspace session has expired. Reload the page to start a new session.",
};

export function aiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return AI_ERROR_MESSAGES[error.code] ?? error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong while contacting Groq. Please try again.";
}

export function isAiRequestError(error: unknown, code: string): boolean {
  return error instanceof ApiRequestError && error.code === code;
}
