import puppeteer, { type LaunchOptions } from "puppeteer-core";
import {
  PdfRendererUnavailableError,
  isExecutable,
  isServerlessEnvironment,
  resolveLocalExecutable,
} from "./status";

export interface PdfSessionCookie {
  name: string;
  value: string;
}

async function getLaunchOptions(): Promise<LaunchOptions> {
  if (isServerlessEnvironment()) {
    const { default: chromium } = await import("@sparticuz/chromium");
    const headless = "shell" as const;
    return {
      args: await puppeteer.defaultArgs({ args: chromium.args, headless }),
      executablePath: await chromium.executablePath(),
      headless,
      defaultViewport: { width: 1240, height: 1754, deviceScaleFactor: 1 },
    };
  }

  const executablePath = await resolveLocalExecutable();
  if (!executablePath) {
    throw new PdfRendererUnavailableError(
      "No Chromium executable is available. Install Chrome/Chromium or set CHROME_EXECUTABLE_PATH. You can still use Print / Save as PDF.",
    );
  }

  if (!(await isExecutable(executablePath))) {
    throw new PdfRendererUnavailableError(
      `Chromium is not executable at ${executablePath}. Check CHROME_EXECUTABLE_PATH.`,
    );
  }

  return {
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
      "--hide-scrollbars",
    ],
    defaultViewport: { width: 1240, height: 1754, deviceScaleFactor: 1 },
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * Renders the authenticated print view in Chromium and captures it as A4 PDF.
 *
 * Using the live print route (rather than re-rendering React to a string)
 * guarantees that the exported document is byte-for-byte the design shown in
 * the app, keeps a single source of truth for the template, and avoids
 * importing `react-dom/server` into a React Server Components runtime.
 */
export async function generateResumePdf({
  resumeId,
  baseUrl,
  sessionCookie,
}: {
  resumeId: string;
  baseUrl: string;
  sessionCookie: PdfSessionCookie | null;
}): Promise<Buffer> {
  const origin = normalizeBaseUrl(baseUrl);
  const printUrl = `${origin}/print/${encodeURIComponent(resumeId)}?auto=0`;

  let options: LaunchOptions;
  try {
    options = await getLaunchOptions();
  } catch (error) {
    if (error instanceof PdfRendererUnavailableError) throw error;
    console.error("[vellum] Could not prepare the PDF renderer", error);
    throw new PdfRendererUnavailableError(
      "The PDF renderer could not start on this host. Use Print / Save as PDF instead.",
    );
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

  try {
    try {
      browser = await puppeteer.launch(options);
    } catch (error) {
      console.error("[vellum] Chromium failed to launch", error);
      throw new PdfRendererUnavailableError(
        "Chromium could not launch on this host. Use Print / Save as PDF instead.",
      );
    }

    const page = await browser.newPage();

    if (sessionCookie) {
      await page.setCookie({
        name: sessionCookie.name,
        value: sessionCookie.value,
        url: origin,
        httpOnly: true,
        secure: origin.startsWith("https://"),
        sameSite: "Lax",
      });
    }

    const response = await page.goto(printUrl, {
      waitUntil: "networkidle0",
      timeout: 45_000,
    });

    if (!response || !response.ok()) {
      throw new Error(
        `The print view returned an unexpected status${
          response ? ` (${response.status()})` : ""
        }.`,
      );
    }

    // The print view is a client-hydrated page; wait for the document itself
    // so we never capture a loading shell.
    await page.waitForSelector(".resume", { timeout: 15_000 });

    // Ensure variable web fonts and styles settle before layout is captured.
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }
    });
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdf);
  } catch (error) {
    if (error instanceof PdfRendererUnavailableError) throw error;
    console.error("[vellum] PDF generation failed", error);
    throw new Error("The PDF renderer failed to generate this document.");
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
