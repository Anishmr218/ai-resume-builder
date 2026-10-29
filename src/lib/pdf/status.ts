import { constants as fsConstants } from "node:fs";
import { access } from "node:fs/promises";

export class PdfRendererUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfRendererUnavailableError";
  }
}

export interface PdfRendererStatus {
  available: boolean;
  mode: "local" | "serverless" | "unavailable";
  executablePath?: string;
  reason?: string;
}

const LOCAL_CHROME_CANDIDATES = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/opt/google/chrome/chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

export function isServerlessEnvironment(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.USE_SPARTICUZ_CHROMIUM === "true",
  );
}

export async function isExecutable(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function resolveLocalExecutable(): Promise<string | null> {
  const configured =
    process.env.CHROME_EXECUTABLE_PATH?.trim() ||
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (configured) return configured;

  for (const candidate of LOCAL_CHROME_CANDIDATES) {
    if (await isExecutable(candidate)) return candidate;
  }
  return null;
}

export async function getPdfRendererStatus(): Promise<PdfRendererStatus> {
  const configured =
    process.env.CHROME_EXECUTABLE_PATH?.trim() ||
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (configured) {
    return (await isExecutable(configured))
      ? { available: true, mode: "local", executablePath: configured }
      : {
          available: false,
          mode: "unavailable",
          reason: `CHROME_EXECUTABLE_PATH does not point to an executable: ${configured}`,
        };
  }

  if (isServerlessEnvironment()) {
    return { available: true, mode: "serverless" };
  }

  const executable = await resolveLocalExecutable();
  return executable
    ? { available: true, mode: "local", executablePath: executable }
    : {
        available: false,
        mode: "unavailable",
        reason:
          "No Chromium executable found. Set CHROME_EXECUTABLE_PATH, install Chrome, or use the print fallback.",
      };
}
