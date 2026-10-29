import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { AiError } from "@/lib/ai/errors";
import type { ApiErrorBody } from "@/lib/resume/types";
import { formatZodError } from "@/lib/resume/validation";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function unauthorized(): NextResponse<ApiErrorBody> {
  return jsonError(
    401,
    "UNAUTHORIZED",
    "Your workspace session has expired. Reload the page to start a new session.",
  );
}

export function notFound(message = "Resume not found."): NextResponse<ApiErrorBody> {
  return jsonError(404, "NOT_FOUND", message);
}

export async function readJson(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (!raw) throw new HttpError(400, "EMPTY_BODY", "A JSON body is required.");
  if (raw.length > 1_000_000) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export function validationError(error: ZodError): NextResponse<ApiErrorBody> {
  return jsonError(
    422,
    "VALIDATION_ERROR",
    "Some fields need your attention.",
    formatZodError(error),
  );
}

export function handleRouteError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof HttpError) {
    return jsonError(error.status, error.code, error.message, error.details);
  }

  if (error instanceof AiError) {
    return jsonError(error.status, error.code, error.message, error.details);
  }

  console.error("[vellum] Unhandled API error", error);
  return jsonError(
    500,
    "INTERNAL_ERROR",
    "Something went wrong on our side. Please try again.",
  );
}

export function noStoreHeaders(): HeadersInit {
  return { "Cache-Control": "no-store" };
}
