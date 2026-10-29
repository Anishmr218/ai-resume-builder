import { cp, mkdir, access } from "node:fs/promises";
import path from "node:path";

/**
 * Next's standalone server needs the browser assets alongside its traced
 * server bundle. Docker copies these explicitly; this keeps local
 * `npm run build && npm start` equally complete.
 */
async function main() {
  const root = process.cwd();
  const standalone = path.join(root, ".next", "standalone");

  try {
    await access(path.join(standalone, "server.js"));
  } catch {
    console.log("[vellum] No standalone output found; skipping asset copy.");
    return;
  }

  await mkdir(path.join(standalone, ".next"), { recursive: true });
  await cp(path.join(root, "public"), path.join(standalone, "public"), {
    recursive: true,
    force: true,
  });
  await cp(
    path.join(root, ".next", "static"),
    path.join(standalone, ".next", "static"),
    { recursive: true, force: true },
  );

  console.log("[vellum] Prepared standalone public + static assets.");
}

main().catch((error) => {
  console.error("[vellum] Could not prepare standalone assets", error);
  process.exitCode = 1;
});
