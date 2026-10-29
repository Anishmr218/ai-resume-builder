# Vellum — Resume Studio

A calm, cloud-native **AI-powered resume studio** with a live split-screen editor, two editorial templates, ATS guidance, Groq-assisted writing, and server-rendered PDF export.

Write on the left. Watch the document come to life on the right. Every edit is saved automatically to PostgreSQL, exports are archived to S3-compatible storage, and AI suggestions only land in your resume when you approve them.

![Vellum resume studio — Modern Minimalist template](docs/desktop-modern.png)

## Why Vellum

- **Live split-screen editing** — personal details, summary, experience, education, skills, and projects update the preview instantly.
- **Two resume templates** — *Modern Minimalist* and *Executive Classic*, both single-column and ATS-friendly, with five accent colors.
- **Autosave that behaves** — 900 ms debounce, revision tracking, optimistic UI, retry on failure, and `Cmd/Ctrl + S` for an explicit save.
- **Groq-powered editing** — enhance experience bullets, draft a three-sentence summary, suggest role-specific skills, and score the resume against a real job posting. Every AI output is previewed and approved before it touches the document.
- **ATS readiness panel** — ten checks covering contact details, headings, measurable impact, skills, and document length, plus a live completeness score.
- **Real PDF export** — A4, selectable text, embedded fonts, and a print-view fallback for hosts without Chromium.
- **Cloud archive** — store generated PDFs in any S3-compatible bucket and return short-lived signed URLs.
- **Profile photo upload** — validated PNG/JPEG/WebP, stored privately, shown only in the workspace UI (never in the resume).
- **Anonymous by default** — a new workspace gets a polished sample resume; one click clears it.
- **Zero-config development** — an in-memory store and local signed-URL storage let you run the UI without PostgreSQL or cloud credentials.
- **Production strictness** — production requires PostgreSQL and S3-compatible storage; the app fails closed instead of silently using ephemeral data.

### Screenshots

| Modern Minimalist | Executive Classic |
| --- | --- |
| ![Modern template](docs/desktop-modern.png) | ![Executive template](docs/desktop-executive.png) |

| ATS readiness | Mobile editor | Mobile preview |
| --- | --- | --- |
| ![ATS report](docs/ats-report.png) | ![Mobile editor](docs/mobile-editor.png) | ![Mobile preview](docs/mobile-preview.png) |

A generated sample is available at [`docs/sample-resume.pdf`](docs/sample-resume.pdf). It is one A4 page with selectable text and cleanly extractable section headings.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js `15.5.28` App Router, React `19.3.1` |
| Styling | Tailwind CSS `3.4`, Radix UI primitives, Sonner toasts, Lucide icons |
| Validation | Zod |
| AI | Groq via `groq-sdk`, JSON object output validated again with Zod |
| Database | PostgreSQL 14+ via `pg` with a hand-written repository (no ORM) |
| Storage | AWS SDK v3 against AWS S3, Cloudflare R2, MinIO, GCS interoperability, or another S3 provider |
| PDF | `puppeteer-core` + Chromium; `@sparticuz/chromium` on Vercel/AWS Lambda |
| Interface fonts | Manrope + Fraunces via `next/font` |
| Document fonts | Self-hosted Inter Variable + Source Serif 4 Variable (`public/fonts`) |
| Tests | Vitest |

The resume document is rendered from one semantic React template. The editor preview, `/print/[id]`, and the headless-Chromium PDF all use the same markup and CSS, so what you see is what gets exported.

## Quick start

### Requirements

- Node.js **20.9+** (Node 22 recommended)
- npm
- Chrome or Chromium for server-side PDF export (optional; the UI falls back to print view)
- A Groq API key from [Groq Console](https://console.groq.com/keys) (optional; AI actions explain how to configure it when absent)

### Option A — zero-config development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No `.env.local` is required.

In this mode:

- Data lives in an in-memory repository and resets when the dev server restarts.
- Avatars and PDF archives are written to `.data/storage` and served through HMAC-signed `/api/storage/*` URLs.
- If no Chromium executable is found, **Download PDF** offers the print view instead. Chrome is detected at the common macOS/Linux paths, or set `CHROME_EXECUTABLE_PATH`.

If a `.env.local` exists with `DATABASE_URL` set, the app will try to use PostgreSQL instead. Remove or rename it to return to zero-config mode.

To enable AI in this mode, add `GROQ_API_KEY=...` to `.env.local` and restart the dev server. The editor, autosave, preview, and PDF fallback all work without a key; the four AI actions return a clear `AI_NOT_CONFIGURED` message.

### Option B — full local stack (PostgreSQL + S3-compatible storage)

Start the bundled PostgreSQL 16 and Adobe S3Mock services:

```bash
docker compose up -d db s3mock
```

Create `.env.local`:

```dotenv
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://vellum:vellum@localhost:5432/vellum
DATABASE_SSL=false

S3_BUCKET=vellum-exports
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9090
S3_PUBLIC_ENDPOINT=http://localhost:9090
S3_ACCESS_KEY_ID=test
S3_SECRET_ACCESS_KEY=test
S3_FORCE_PATH_STYLE=true

STORAGE_SIGNING_SECRET=local-development-only

GROQ_API_KEY=your_groq_api_key_here
# GROQ_MODEL=openai/gpt-oss-20b
```

Then apply the schema, verify both services, and start the app:

```bash
npm run db:migrate
npm run db:check
npm run dev
```

`npm run db:migrate` is idempotent. Docker also applies `schema.sql` automatically the first time the database volume is created. The `db:check` command prints the PostgreSQL version, table presence, row counts, and expired-session count.

Check the runtime wiring:

```bash
curl -s http://localhost:3000/api/health | jq
```

`services.database.driver` should be `postgres` and `services.storage.provider` should be `s3`.

### Option C — the whole app in Docker

```bash
docker compose --profile full up --build
```

Open <http://localhost:3000>. This builds the production image (including Chromium), starts PostgreSQL and S3Mock, waits for both to be healthy, and runs the standalone Next.js server.

To enable AI in the full stack, export `GROQ_API_KEY` before starting Compose (or add it to a local `.env` file). Compose forwards it and `GROQ_MODEL` to the app container:

```bash
GROQ_API_KEY=your_key docker compose --profile full up --build
```

The app container reaches S3Mock at `http://s3mock:9090`; signed download URLs are rewritten to `http://localhost:9090` through `S3_PUBLIC_ENDPOINT` so the browser can resolve them. If you access the app from another machine, set `APP_URL` and `S3_PUBLIC_ENDPOINT` accordingly before starting Compose.

```bash
docker compose down          # keep the database and object-storage volumes
docker compose down -v       # destructive: delete local data
```

### Option D — production build without Docker

```bash
npm ci
npm run build
npm start
```

`npm start` runs the Next.js standalone server at `.next/standalone/server.js`. The `postbuild` hook copies `public/` and `.next/static/` into the standalone directory so the runtime serves fonts, CSS, and chunks correctly.

Environment variables are **not baked into the build**. Provide them at runtime through your platform or an env file. The server respects `PORT` (default `3000`) and binds to `0.0.0.0`. Add `GROQ_API_KEY` (and optionally `GROQ_MODEL`) at runtime to enable AI; restart after changing it.

> Production mode requires PostgreSQL and S3-compatible storage. Without `DATABASE_URL`, API requests fail; without `S3_BUCKET`, uploads and cloud exports fail and `/api/health` reports storage as misconfigured.

## How it works

```text
┌──────────────────────────── Browser ────────────────────────────┐
│ React 19 client store                                           │
│ • optimistic edits, 900 ms autosave, revision tracking          │
│ • live ResumeDocument preview                                   │
└───────────────┬─────────────────────────────────────────────────┘
                │ JSON + HTTP-only session cookie
┌───────────────▼─────────────────────────────────────────────────┐
│ Next.js Route Handlers (Node runtime)                           │
│ • Zod validation       • session lookup                         │
│ • pg repository        • S3 adapter                             │
│ • AI routes ──► Groq JSON object ──► Zod validation             │
│ • PDF route ──► headless Chromium ──► /print/[id]?auto=0        │
└───────────────┬───────────────────────────┬─────────────────────┘
                │                           │
        ┌───────▼────────┐          ┌───────▼──────────────┐
        │ PostgreSQL     │          │ S3-compatible bucket │
        │ users          │          │ avatars/...          │
        │ resumes        │          │ exports/...          │
        │ child tables   │          └──────────────────────┘
        │ sessions       │
        │ exports        │
        └────────────────┘
```

### Editor and autosave

- The client store (`src/hooks/use-resume-store.tsx`) bootstraps through `POST /api/session` and holds the active resume.
- Edits update local state immediately. A 900 ms debounce sends a `PATCH` with the full editable document.
- A monotonic revision counter prevents an older response from overwriting newer keystrokes. If edits arrive during a request, a follow-up save is scheduled automatically.
- Failures surface in the header with a retry action. Downloads and exports call `saveNow()` first so the generated PDF always reflects the latest text.
- `Cmd/Ctrl + S` forces an immediate save.
- "Start fresh" clears content on the existing resume while preserving the chosen template and accent, then persists it.

### Data layer

`src/lib/repository/index.ts` selects a store at runtime:

- `DATABASE_URL` set → PostgreSQL repository (`src/lib/repository/postgres.ts`).
- No `DATABASE_URL` and `NODE_ENV !== "production"` → in-memory repository.
- No `DATABASE_URL` in production → throws; no silent data loss.

The PostgreSQL store writes resume content in a transaction and replaces child rows (`experience_entries`, `education_entries`, `resume_skills`, `project_entries`) atomically. Child reads are sequential on a single connection so `pg` never runs concurrent queries on one client.

The connection pool is cached across hot reloads and serverless invocations in a global. Point `DATABASE_URL` at a pooler (Neon, Supabase, RDS Proxy, PgBouncer) in serverless environments.

### Sessions

Vellum ships with anonymous, cookie-bound workspaces rather than accounts:

- `POST /api/session` creates a 32-byte random token, sets it as an HTTP-only, `SameSite=Lax` cookie, and stores only its SHA-256 hash in `sessions`.
- The cookie is marked `Secure` whenever the request is HTTPS (`X-Forwarded-Proto` or the request URL). On a plain-HTTP deployment the cookie is issued without `Secure` so the workspace can still persist; use HTTPS in production.
- `POST /api/session` also returns the same opaque token in the `X-Vellum-Session` response header. The browser keeps it in per-tab `sessionStorage` and sends it on API calls, so sessions survive proxies or CDNs that strip cookies. The cookie remains the primary credential.
- Sessions live for 30 days. Expired tokens no longer resolve.
- Every new workspace receives the sample resume so the editor is immediately useful.
- All resume reads and writes are scoped to the session's `user_id`, and every route re-checks ownership.

This is intentional for a single-workspace product demo. See [Security notes](#security-notes) before exposing it as a multi-tenant service.

### Storage

`src/lib/storage/index.ts` selects an adapter:

- `S3_BUCKET` set → S3-compatible adapter. Credentials are optional, so ECS task roles, EC2 instance profiles, GKE Workload Identity, and other ambient credential sources work.
- Otherwise, in development → local filesystem adapter with HMAC-signed URLs.
- Otherwise, in production → throws.

Objects are private. The app returns short-lived signed URLs:

| Object | Key pattern | Signed URL lifetime |
| --- | --- | --- |
| Profile photo | `avatars/<userId>/<uuid>.<png\|jpg\|webp>` | 1 hour |
| Archived PDF | `exports/<userId>/<resumeId>/<timestamp>-<id>.pdf` | 15 minutes |

`S3_PUBLIC_ENDPOINT` exists for topologies where the app talks to storage over an internal network but the browser needs a public address. The private client still uses `S3_ENDPOINT`; only URL signing uses the public endpoint.

The local adapter is development-only. It stores files under `.data/storage` and signs URLs with `STORAGE_SIGNING_SECRET`; the `/api/storage/[...key]` route refuses to serve anything when S3 is configured.

### PDF pipeline

`POST /api/resumes/:id/pdf` starts headless Chromium, sets the session cookie on the browser context, navigates to the authenticated `/print/:id?auto=0` page, waits for `.resume` and `document.fonts.ready`, switches to print media, and writes an A4 PDF with `preferCSSPageSize: true`.

This approach has a few advantages:

- One source of truth for markup and CSS; the PDF matches the live preview.
- No `react-dom/server` import inside a React Server Components runtime.
- The print view is a real authenticated page that can also be opened manually.

If Chromium is unavailable, the route returns `503` with:

```json
{
  "error": {
    "code": "PDF_RENDERER_UNAVAILABLE",
    "message": "…",
    "details": {
      "fallbackUrl": "/print/<id>?auto=1"
    }
  }
}
```

The download menu turns that into an "Open print view" action. The print route is fully usable in a normal browser and produces selectable, ATS-friendly text through the system print dialog.

`POST /api/resumes/:id/export` runs the same pipeline, uploads the bytes to `exports/...`, records the export in PostgreSQL, and returns a 15-minute signed URL. The PDF routes declare `maxDuration = 60`; local generation typically takes 14–25 seconds, including Chromium startup.

### ATS-friendly documents

Both templates share semantic, single-column markup:

- Standard headings: `SUMMARY`, `EXPERIENCE`, `EDUCATION`, `PROJECTS`, `SKILLS`.
- Contact details render as separate plain-text lines rather than icon-only elements.
- Dates use `Mon YYYY — Mon YYYY` (or `Present`), avoiding locale drift.
- No tables, text-in-images, or multi-column reading order.
- Embedded Inter/Source Serif fonts; the PDF does not depend on Google Fonts at render time.
- Links are displayed as readable text, with `http(s)`-only hrefs on screen and in print.
- Headings use typographic letter-spacing that still extracts cleanly as the expected words.

The ATS panel is guidance, not a guarantee. Applicant-tracking systems vary, and some parse scanned or heavily designed documents differently. The included sample PDF is a useful extraction check:

```bash
pdftotext docs/sample-resume.pdf - | head -40
```

You should see the name, contact lines, and section headings as plain text.

## AI Capabilities & Architecture

Vellum's AI is an editing assistant, not an autonomous writer. Groq generates options in a focused dialog; the resume changes only after the user selects a bullet, approves a summary, or clicks a suggested skill. Accepted edits then flow through the existing `mutate()` → 900 ms autosave → PostgreSQL path, so AI-assisted content remains a normal, editable part of the document.

| Capability | Endpoint | Editor entry point | What Groq returns |
| --- | --- | --- | --- |
| Work experience bullet enhancer | `POST /api/ai/enhance-bullet` | **Enhance with AI** above each role's highlights | Three distinct, action-led, metric-rich bullet variations tailored to the role or target title |
| Executive summary generator | `POST /api/ai/generate-summary` | **Generate with AI** in Personal details | A three-sentence, 55–90 word summary built from the target title, skills, and experience |
| ATS job matcher | `POST /api/ai/match-job` | **Match a job** card at the top of the editor | A calibrated 0–100 score, missing critical keywords, and exactly three prioritized edits |
| Smart skill suggester | `POST /api/ai/suggest-skills` | **Suggest with AI** in Skills | Categorized Technical, Tools, and Soft skills tags, added only when clicked |

### Request flow

```text
Editor dialog
  │ typed request via src/lib/client/api.ts
  ▼
POST /api/ai/*  (session required, Node runtime, maxDuration = 60)
  │ 1 MB body cap + Zod request validation
  ▼
src/lib/ai.ts
  │ lazy Groq client from GROQ_API_KEY
  │ model: GROQ_MODEL || openai/gpt-oss-20b
  │ 45 s upstream timeout, task-specific temperature
  ▼
Groq chat.completions.create
  │ response_format = json_object + JSON Schema in system prompt
  │ parse → Zod response validation → normalization
  ▼
Preview / approval dialog
  │ explicit user selection or approval
  ▼
useResumeStore.mutate → autosave → PostgreSQL
  │ existing preview, PDF, and S3 export pipelines unchanged
  ▼
```

### Design decisions

- **One Groq gateway.** `src/lib/ai.ts` is the only module that imports `groq-sdk`. It owns the lazy client, model selection, timeout, JSON parsing, response validation, and task orchestration. Prompts (`src/lib/ai/prompts.ts`), JSON schemas (`json-schemas.ts`), contracts (`schemas.ts`), and error mapping (`errors.ts`) stay separate and testable.
- **Structured output twice.** Groq is asked for JSON object mode with the expected schema in the system prompt, and the parsed result is validated with a second, independent Zod schema. If the shape is wrong, the user gets `AI_BAD_RESPONSE` instead of malformed resume content.
- **Untrusted input is bounded.** Request schemas cap bullets at 600 characters, job descriptions at 20,000, skills at 40, experience at 20 roles, and the HTTP body at 1 MB. Prompts delimit resume and job text and explicitly instruct the model to ignore instructions embedded inside that data.
- **Approval before mutation.** Bullet variations are selectable cards; summaries are previewed and only replace the summary field on approval; suggested skills are inert until clicked. Nothing is written by the API routes themselves.
- **Server-only credentials.** `GROQ_API_KEY` is never exposed to the browser and is checked lazily on each AI request. Missing or placeholder keys return `AI_NOT_CONFIGURED`; the rest of the editor continues to work.
- **No automatic retries.** AI requests time out after 45 seconds and are not retried server-side, avoiding surprise duplicate spend during provider incidents. The UI offers an explicit **Retry** action.
- **Job descriptions are not persisted.** The posting is sent to Groq for the analysis request only. It is not written to PostgreSQL, logs, or object storage. Review Groq's data terms for your plan before pasting confidential material.
- **Human review is part of the product.** The UI labels AI output as an estimate, warns that illustrative metrics must be verified, and reminds users to claim only skills they can defend in an interview.
- **No changes to document generation.** AI has no access to the PDF/Chromium pipeline, S3 export adapter, or database schema. Accepted AI text is ordinary resume content.

### Configuration

1. Create a key in [Groq Console](https://console.groq.com/keys).
2. Add it to `.env.local` for development, or your platform's secret manager in production:
   ```dotenv
   GROQ_API_KEY=your_groq_api_key_here
   # Optional. Defaults to openai/gpt-oss-20b.
   # GROQ_MODEL=openai/gpt-oss-20b
   ```
3. Restart the app so the server process sees the new environment. The Docker Compose app profile forwards both variables automatically.
4. If your key cannot access the default model, set `GROQ_MODEL` to a Groq model available to your account.

The key is read at request time. With no key, the editor, autosave, ATS panel, PDF export, and cloud archive continue to work; only the four AI actions return a configuration error.

### AI error codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `AI_NOT_CONFIGURED` | `503` | `GROQ_API_KEY` is missing, still set to the example placeholder, or still contains a Google Gemini key. |
| `AI_KEY_INVALID` | `502` | Groq rejected the key (`401`/`403`/`invalid_api_key`). Verify the secret and restart. |
| `AI_RATE_LIMITED` | `429` | The project hit a Groq quota or rate limit. Wait, then retry or review provider quotas. |
| `AI_TIMEOUT` | `504` | Groq did not answer within 45 seconds. Retry the action. |
| `AI_MODEL_UNAVAILABLE` | `502` | The configured model is not available to this key/API version. Change `GROQ_MODEL`. |
| `AI_CONTENT_BLOCKED` | `502` | The model declined the input/output on safety grounds. Reword the source. |
| `AI_BAD_RESPONSE` | `502` | Groq returned malformed or incomplete JSON. Retry; the resume is untouched. |
| `AI_UPSTREAM_ERROR` | `502` | A transient Groq or transport failure. Retry shortly. |

All AI routes require the anonymous workspace cookie, return `Cache-Control: no-store`, and use the same `{ error: { code, message, details } }` envelope as the rest of the API. The client maps each code to a plain-language inline message and, where useful, a retry button.

## Configuration

Copy `.env.example` to `.env.local` for development, or set these variables in your platform.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_URL` | request origin | Public origin used by the PDF renderer to open the print route. Set to the deployed HTTPS origin in production. Must be reachable from the app server and must not be blocked by deployment protection. |
| `DATABASE_URL` | — | PostgreSQL connection string. Required in production. |
| `DATABASE_SSL` | `false` | `true` for managed providers that require TLS. |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `true` | Leave `true` unless your provider uses a private CA and you have configured `NODE_EXTRA_CA_CERTS`. |
| `DB_POOL_MAX` | `5` | Maximum pool size per process/instance. Lower it for serverless poolers. |
| `SESSION_COOKIE_NAME` | `vellum_session` | Cookie name; change when multiple apps share a domain. |
| `GROQ_API_KEY` | — | Server-only Groq API key. Required for AI actions; the rest of the editor works without it. |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Groq model used by all four AI routes. Override if your API key uses a different available model. |
| `S3_BUCKET` | — | Bucket for avatars and archived PDFs. Required in production. |
| `S3_REGION` | `us-east-1` | Bucket/signing region. |
| `S3_ENDPOINT` | AWS default | Custom endpoint for R2, MinIO, S3Mock, GCS interoperability, etc. |
| `S3_PUBLIC_ENDPOINT` | `S3_ENDPOINT` | Browser-facing endpoint used only for signed URLs. |
| `S3_ACCESS_KEY_ID` | — | Optional. Omit when using an IAM role/workload identity. |
| `S3_SECRET_ACCESS_KEY` | — | Optional. Omit when using an IAM role/workload identity. |
| `S3_FORCE_PATH_STYLE` | `false` | `true` for MinIO, S3Mock, and gateways that require path-style addressing. |
| `S3_SERVER_SIDE_ENCRYPTION` | — | Set to `AES256` to request SSE-S3 on uploads. |
| `STORAGE_SIGNING_SECRET` | dev fallback | Signs local development URLs. Has no effect when S3 is configured. |
| `CHROME_EXECUTABLE_PATH` | auto-detect | Explicit Chrome/Chromium path. |
| `PUPPETEER_EXECUTABLE_PATH` | auto-detect | Alternative executable path variable. |
| `USE_SPARTICUZ_CHROMIUM` | auto | Force the serverless Chromium path. Automatically enabled when `VERCEL` or `AWS_LAMBDA_FUNCTION_NAME` is present. |

See [`.env.example`](.env.example) for commented examples.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Production build, then prepare standalone assets via `postbuild`. |
| `npm start` | Run the standalone production server. Requires `npm run build`. |
| `npm run typecheck` | TypeScript check without emitting. |
| `npm run lint` | ESLint with the Next.js core-web-vitals rules. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run db:migrate` | Apply `schema.sql`; idempotent. |
| `npm run db:check` | Check the PostgreSQL version, tables, row counts, and expired sessions. |

## API

All routes use the Node runtime. Except for `/api/health`, `/api/session`, and the development storage route, requests require the workspace cookie. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "…",
    "details": { "field": "message" }
  }
}
```

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Readiness probe. `200` when the database is reachable and storage is configured; `503` otherwise. PDF availability is reported separately and does not fail the probe. |
| `POST` | `/api/session` | Create or resume an anonymous workspace. Returns `{ user, resume, isSample }` and sets the session cookie. |
| `GET` | `/api/resumes` | List resume summaries for the current workspace. |
| `POST` | `/api/resumes` | Create a resume. Accepts a partial resume body; missing fields use empty defaults. Returns `201` with `{ resume }`. |
| `GET` | `/api/resumes/:id` | Fetch a resume scoped to the session owner. |
| `PATCH` | `/api/resumes/:id` | Partial update. Child collections are replaced when provided. |
| `DELETE` | `/api/resumes/:id` | Delete a resume and its children. Returns `204`. |
| `POST` | `/api/resumes/:id/pdf` | Generate and stream a PDF (`application/pdf`, attachment). Returns `503` with `fallbackUrl` if Chromium is unavailable. |
| `POST` | `/api/resumes/:id/export` | Generate, archive to S3, record the export, and return `{ url, key, fileName, bytes, expiresIn, storage }`. |
| `POST` | `/api/users/me/avatar` | Multipart upload (`file` field). Max 2 MB; PNG, JPEG, or WebP detected by magic bytes. |
| `DELETE` | `/api/users/me/avatar` | Remove the workspace avatar and its object. |
| `POST` | `/api/ai/enhance-bullet` | Rewrite one experience bullet into three ATS-friendly variations. Body: `{ bullet, targetTitle? }`. |
| `POST` | `/api/ai/generate-summary` | Draft a three-sentence summary. Body: `{ targetTitle, skills, experience }`. |
| `POST` | `/api/ai/match-job` | Estimate job alignment. Body: `{ resume, jobDescription }`; returns score, missing keywords, and three suggestions. |
| `POST` | `/api/ai/suggest-skills` | Suggest categorized skills. Body: `{ title, industry? }`; returns `technical`, `tools`, and `softSkills` arrays. |
| `GET` | `/api/storage/[...key]` | Development-only signed object URLs for local storage. |
| `GET` | `/print/:id?auto=0\|1` | Authenticated print view. `auto=1` opens the browser print dialog. |

Example session and update:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/session

curl -b cookies.txt http://localhost:3000/api/resumes

curl -b cookies.txt -X PATCH http://localhost:3000/api/resumes/<id> \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Jordan Vale","headline":"Staff Product Designer"}'
```

Resume writes accept:

```ts
{
  title: string;
  template: "modern" | "executive";
  accent: string;            // #RRGGBB
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  summary: string;
  experience: Array<{
    id: string;              // UUID
    role: string;
    company: string;
    location: string;
    startDate: string;       // YYYY-MM or ""
    endDate: string;         // YYYY-MM or ""
    current: boolean;
    highlights: string[];
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    details: string;
  }>;
  skills: string[];          // deduplicated, max 44 chars each
  projects: Array<{
    id: string;
    name: string;
    link: string;
    description: string;
  }>;
}
```

`PATCH` accepts any subset. Unknown keys are rejected. The API never trusts a client-supplied `user_id`.

## Database

The schema targets PostgreSQL 14+ and is managed directly with [`schema.sql`](schema.sql). No ORM or migration framework is required.

| Table | Purpose |
| --- | --- |
| `users` | Workspace identity, display name, avatar key, timestamps. |
| `resumes` | Resume header fields, template, accent, summary. |
| `experience_entries` | Ordered roles, dates, and text-array highlights. |
| `education_entries` | Ordered education records. |
| `resume_skills` | Ordered skill strings. |
| `project_entries` | Ordered projects. |
| `sessions` | SHA-256 token hashes, owner, expiry. |
| `exports` | Audit trail for PDFs archived to object storage. |

All resume child rows use `ON DELETE CASCADE`. Indexes cover workspace lookups, child ordering, session expiry, and export history. `updated_at` triggers keep user and resume timestamps accurate.

Apply it to a managed instance:

```bash
DATABASE_URL='postgresql://…' DATABASE_SSL=true npm run db:migrate
```

`pgcrypto` supplies `gen_random_uuid()`; PostgreSQL 13+ also has it built in. If your provider restricts extensions, replace the defaults with application-generated UUIDs.

## Deployment

### Vercel

Vellum is designed for Vercel's Node.js runtime:

1. Import the repository and keep the default Next.js build settings (`npm ci`, `npm run build`).
2. Provision PostgreSQL (Neon, Supabase, RDS, etc.) and apply the schema from your machine or CI:
   ```bash
   DATABASE_URL='postgresql://…' DATABASE_SSL=true npm run db:migrate
   ```
   Prefer the provider's pooled connection string; set `DB_POOL_MAX` conservatively.
3. Create a private S3 bucket (AWS S3 or Cloudflare R2) and set `S3_BUCKET`, `S3_REGION`, and credentials. With an S3-compatible provider, also set `S3_ENDPOINT`; use `S3_FORCE_PATH_STYLE=true` where required.
4. Set environment variables in the Vercel project:
   - `APP_URL=https://your-production-domain.example`
   - `DATABASE_URL=…`, `DATABASE_SSL=true`
   - `S3_BUCKET=…`, `S3_REGION=…`, `S3_ACCESS_KEY_ID=…`, `S3_SECRET_ACCESS_KEY=…`
   - `GROQ_API_KEY=…` (and optionally `GROQ_MODEL=openai/gpt-oss-20b`)
   - Optionally `S3_SERVER_SIDE_ENCRYPTION=AES256`
5. Deploy. `@sparticuz/chromium` is selected automatically because Vercel sets `VERCEL`.

Important production notes:

- **Deployment Protection must not intercept `/print/*`.** The headless browser navigates to `APP_URL/print/<id>` without a bypass token. If Vercel Authentication protects that route, PDF generation will capture a login page or fail. Keep the production alias unprotected, protect only preview deployments, or use a dedicated custom domain that bypasses protection.
- Set `APP_URL` per environment. A preview deployment that points at the production alias will not have the preview session cookie, so its print route will not authenticate.
- Allow enough memory and time for Chromium. The PDF routes request `maxDuration = 60`; allocate at least 1 GB of function memory. Cold starts make the first export slower.
- If the function times out, the UI reports the failure and print view remains available.
- Keep the bucket private. Add a CORS rule for `GET, HEAD` from your app origin only if you consume signed URLs from client-side JavaScript; normal `<img>` and new-tab downloads do not require it.

### AWS ECS Fargate

The Docker image bundles Debian Chromium and runs as a non-root user.

1. Create an ECR repository and push the image:
   ```bash
   aws ecr get-login-password --region us-east-1 \
     | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

   docker build -t vellum .
   docker tag vellum:latest <account>.dkr.ecr.us-east-1.amazonaws.com/vellum:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/vellum:latest
   ```
2. Create an RDS PostgreSQL instance and apply `schema.sql` from a host with access:
   ```bash
   DATABASE_URL='postgresql://…' DATABASE_SSL=true npm run db:migrate
   ```
3. Create a private S3 bucket. Give the ECS **task role** `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` on `arn:aws:s3:::<bucket>/*`. Do not put static AWS keys in the task definition.
4. Create the ECS service with:
   - Container port `3000`.
   - At least **1 vCPU / 2 GB**; 2 vCPU / 4 GB is comfortable for concurrent PDF exports.
   - Environment: `APP_URL=https://resume.example.com`, `DATABASE_URL` (from Secrets Manager), `DATABASE_SSL=true`, `S3_BUCKET`, `S3_REGION`, `GROQ_API_KEY` (from Secrets Manager), `GROQ_MODEL` (optional), `S3_SERVER_SIDE_ENCRYPTION=AES256` (optional).
   - `CHROME_EXECUTABLE_PATH=/usr/bin/chromium` is already set in the image.
   - Health check: `/api/health` on port `3000`.
5. Put an ALB or CloudFront in front of the service and terminate TLS. Keep `X-Forwarded-Proto` intact so the app marks the session cookie `Secure`. If CloudFront is in front of the ALB, forward cookies (or the `X-Vellum-Session` header) to the origin; the app also accepts the session token in that header when cookies are stripped.
6. Raise the ALB idle timeout above the PDF timeout (for example, 120 seconds). A 60-second PDF request should not be cut off by the default 60-second idle timeout.

The task is stateless. Run multiple replicas behind the load balancer; sessions, resumes, avatars, and exports all live in PostgreSQL/S3.

For RDS with a private CA, mount the CA bundle and set `NODE_EXTRA_CA_CERTS=/path/to/ca.pem`, or use the RDS global bundle. Avoid turning off certificate verification.

### Google Cloud Run

1. Create a Cloud SQL PostgreSQL instance. Connect through the Cloud SQL Auth Proxy sidecar, a private IP with a VPC connector, or the Cloud SQL connector appropriate to your network. Apply the schema with `npm run db:migrate`.
2. Create a bucket. You can use AWS S3/R2 directly, or Cloud Storage through its S3-compatible XML API with HMAC keys:
   ```dotenv
   S3_BUCKET=your-bucket
   S3_ENDPOINT=https://storage.googleapis.com
   S3_FORCE_PATH_STYLE=false
   S3_ACCESS_KEY_ID=<HMAC access ID>
   S3_SECRET_ACCESS_KEY=<HMAC secret>
   # S3_REGION defaults to us-east-1. If your provider validates the region
   # in SigV4 signatures, set the value that matches your bucket.
   ```
   Confirm upload and signed-URL behavior with a profile photo after deployment.
3. Deploy from source (Cloud Build uses the included Dockerfile) or push the image to Artifact Registry:
   ```bash
   gcloud run deploy vellum \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --timeout 60 \
     --min-instances 0 \
     --set-env-vars APP_URL=https://your-service.run.app,S3_BUCKET=your-bucket,S3_REGION=us-east-1 \
     --set-secrets DATABASE_URL=database-url:latest,S3_ACCESS_KEY_ID=s3-key:latest,S3_SECRET_ACCESS_KEY=s3-secret:latest,GROQ_API_KEY=groq-api-key:latest
   ```
4. Cloud Run injects `PORT`; the standalone server binds correctly. TLS is terminated by Cloud Run, so secure cookies work.
5. PDF generation needs memory. `2Gi` is a good starting point. Keep `--timeout` at 60 seconds or higher to match the route. Set `--min-instances 1` if cold-start PDF latency matters.
6. Do not set `USE_SPARTICUZ_CHROMIUM` on Cloud Run: the image already contains Chromium at `/usr/bin/chromium`.

### Any Docker host

The image is self-contained apart from PostgreSQL and object storage:

```bash
docker build -t vellum .
docker run -d \
  --name vellum \
  -p 3000:3000 \
  --env-file .env.production \
  vellum
```

Place it behind a TLS-terminating reverse proxy (Caddy, nginx, Traefik, an ALB, etc.), set `APP_URL` to the public HTTPS origin, and provide `DATABASE_URL`, `S3_*`, and `GROQ_API_KEY` from your platform's secret manager. No local volume is required; all persistent state belongs in PostgreSQL and S3.

## Operations

### Health and readiness

```bash
curl -fsS https://resume.example.com/api/health
```

- `200 ok`: database reachable and cloud storage configured.
- `503 degraded`: database unavailable or production still using local storage.
- `services.pdf.status` is `ok` or `unavailable`, with the detection path in `services.pdf.mode` (`local`, `serverless`, or `unavailable`). PDF unavailability does **not** fail the readiness probe, because print view remains usable.

Use `/api/health` for load-balancer and container health checks. It is intentionally cheap and does not generate a PDF.

### Cleanup

- PDFs and avatars are never deleted automatically. Add S3 lifecycle rules for `exports/` (for example, expire after 30–90 days) and for orphaned avatars.
- Expired sessions stop resolving immediately but remain in the table. Schedule a periodic cleanup:
  ```sql
  DELETE FROM sessions WHERE expires_at < now();
  ```
- Deleting a user cascades resumes, sessions, and export rows. It does not delete S3 objects; remove the `avatars/<userId>/` and `exports/<userId>/` prefixes when a workspace is deleted.
- For local resets:
  ```bash
  docker exec vellum-db-1 psql -U vellum -d vellum -c 'TRUNCATE users CASCADE;'
  ```

### Backups

Use managed PostgreSQL backups and point-in-time recovery. Enable S3 versioning if archived exports are important. `schema.sql` is additive/idempotent for the initial schema; introduce a versioned migration tool before making destructive production schema changes.

## Security notes

Vellum is deliberately **anonymous-first**, not a complete authentication system.

- There is no sign-up, login, email verification, or password reset. A workspace is whoever holds the session cookie.
- The cookie is HTTP-only, `SameSite=Lax`, `Secure` on HTTPS requests, and only its SHA-256 hash is stored server-side. The same token is also returned once in the `X-Vellum-Session` header for cookie-less proxies; treat it as a bearer credential.
- Ownership is enforced on every resume read/write and avatar operation; UUID route params are validated.
- Zod schemas reject unknown fields and enforce size limits.
- Avatar uploads are limited to 2 MB and accepted only when magic bytes match PNG, JPEG, or WebP. SVG is rejected.
- S3 objects are private; browsers receive short-lived signed URLs.
- Resume links are restricted to `http(s)` before rendering.
- React escapes user text; the PDF pipeline renders the same React tree rather than interpolating HTML strings.
- `GROQ_API_KEY` is read only on the server. It is never included in a client bundle, response, log line, or error payload.
- AI prompts treat resume content and job descriptions as delimited data, not instructions. Inputs are size-bounded, and AI output is parsed as JSON and re-validated with Zod before it can reach the editor.
- AI output is only applied after an explicit user action; job descriptions are not persisted in PostgreSQL, S3, or application logs.

Before operating a public multi-tenant service, add:

- A real authentication provider (Auth.js, Clerk, Cognito, etc.) and user/workspace membership.
- Per-user and per-IP rate limits, especially on `/api/session`, `/api/users/me/avatar`, `/api/ai/*`, and the PDF routes.
- CSRF protection if you change cookie semantics or accept cross-site form posts.
- A Content-Security-Policy and other hardening headers at the edge. The app currently sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`.
- Audit logging, data export/deletion workflows, and a retention policy for personal data.
- Session and orphaned-object cleanup jobs.
- WAF/abuse protection if the service is publicly advertised.
- Secret rotation and least-privilege bucket/IAM policies.

For a private internal deployment, at minimum put the app behind SSO or an authenticated proxy and keep the S3 bucket private.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `DATABASE_URL is required in production` | Env vars are not reaching the standalone server. Check your platform/secret wiring and confirm `DATABASE_URL` at runtime. |
| `/api/health` returns `503` | Inspect `services.database.status` and `services.storage.status`. In production, local storage is treated as misconfigured. |
| `PDF_RENDERER_UNAVAILABLE` | Install Chrome/Chromium, set `CHROME_EXECUTABLE_PATH`, or use the included Docker image. Print view still works. |
| PDF times out on a serverless host | Increase function memory, confirm `APP_URL` is reachable, and ensure `/print/*` is not blocked by deployment protection. |
| PDF captures a login/protection page | Vercel Authentication or a similar proxy is intercepting `/print/*`. Exempt the production print route or the headless browser must be given a bypass. |
| `npm start` says no production build | Run `npm run build` first. `npm start` runs `.next/standalone/server.js`. |
| `ChunkLoadError` / `Loading chunk app/layout failed` | A dev server was restarted or interrupted mid-compile, or its `.next` folder was replaced by a production build. Stop every Next process, run `rm -rf .next`, then start **either** `npm run dev` **or** `npm run build && npm start` — never both against the same `.next`. Hard-reload the browser afterwards. |
| CSS/fonts missing in standalone mode | The `postbuild` step must run. Verify `.next/standalone/.next/static` and `.next/standalone/public` exist. |
| S3 `404` / signature mismatch | Check bucket name and region, use `S3_FORCE_PATH_STYLE=true` for MinIO/S3Mock, and set `S3_PUBLIC_ENDPOINT` when the browser-facing endpoint differs from the internal one. |
| Docker compose app cannot reach the database | Inside Compose, use `db:5432`; from the host, use `localhost:5432`. `DATABASE_URL` is already wired for the `full` profile. |
| Local dev unexpectedly requires PostgreSQL | A `.env.local` contains `DATABASE_URL`. Remove it or start the database. |
| AI actions return `AI_NOT_CONFIGURED` | Add `GROQ_API_KEY` to `.env.local` or your platform's environment, replace the example placeholder, and restart. For Compose, export the key before `docker compose --profile full up`. |
| AI actions return `AI_KEY_INVALID` | Groq rejected the key. Confirm the value has no quotes or stray whitespace, verify it in Groq Console, then restart the process. |
| AI actions return `AI_RATE_LIMITED` | The project hit a Groq quota. Wait, retry, and review the quota/billing settings for the Groq organization behind the key. |
| AI actions return `AI_MODEL_UNAVAILABLE` | The key cannot access the configured model. Set `GROQ_MODEL` to an available Groq model and restart. |
| AI actions return `AI_TIMEOUT` | The provider took longer than 45 seconds. Retry; if it persists, check Groq's status page and your network egress. |
| AI buttons work but output feels generic | Add a specific target title, 3+ skills, and achievement-led bullets. Summary and match quality depend on the profile context supplied to Groq. |
| Build fails while fetching Google Fonts | `next/font/google` needs network access during `next build`. Build on a networked runner or allow `fonts.googleapis.com`/`fonts.gstatic.com`. Resume/document fonts are self-hosted and unaffected. |
| Port 3000 is already in use | Stop the other process or run with `PORT=3001 npm start` (and update `APP_URL` for PDF rendering). |
| S3Mock data disappeared after `down -v` | The compose volume was deleted. Use `docker compose down` without `-v` to keep it. The bundled emulator is Adobe S3Mock; the storage adapter also works with MinIO and other S3 providers. |

## Project structure

```text
.
├── Dockerfile                     # standalone production image with Chromium
├── docker-compose.yml             # PostgreSQL + Adobe S3Mock + optional app profile
├── schema.sql                     # PostgreSQL schema, indexes, triggers
├── .env.example                   # documented environment template
├── docs/                          # screenshots and sample PDF
├── public/
│   ├── fonts/                     # self-hosted Inter + Source Serif 4
│   └── icon.svg
├── scripts/
│   ├── migrate.ts                 # apply schema.sql
│   ├── check-db.ts                # connection/schema/row-count check
│   └── prepare-standalone.mjs     # copy public + static into standalone
├── src/
│   ├── app/
│   │   ├── api/                   # session, resumes, pdf, export, avatar, health, ai
│   │   ├── print/[id]/            # authenticated print view
│   │   ├── layout.tsx             # fonts, metadata, providers
│   │   └── page.tsx
│   ├── components/
│   │   ├── ai/                    # bullet, summary, job-match, and skill dialogs
│   │   ├── editor/                # personal, experience, education, skills, projects
│   │   ├── ui/                    # Radix-based primitives
│   │   ├── header.tsx
│   │   ├── download-menu.tsx
│   │   ├── profile-dialog.tsx
│   │   └── resume-studio.tsx
│   ├── hooks/use-resume-store.tsx # bootstrap, autosave, retry, start fresh
│   └── lib/
│       ├── ai.ts                  # Groq gateway: client, timeout, JSON parsing
│       ├── ai/                    # prompts, schemas, error mapping, AI types
│       ├── repository/            # PostgreSQL + in-memory stores
│       ├── storage/               # S3 + local signed-URL adapters
│       ├── pdf/                   # Chromium renderer + status detection
│       ├── resume/                # types, sample, validation, ATS, templates
│       ├── auth.ts                # cookie sessions
│       ├── db.ts                  # pg pool + SSL config
│       └── http.ts                # API errors and helpers
└── tests/                         # Vitest unit tests, including AI contracts
```

## Tests and verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The current suite covers resume computation (ATS/completeness), formatting/URL safety, API validation, AI request/response contracts, skill normalization, and Groq error classification (29 tests). The production path has also been exercised end-to-end against PostgreSQL 16 and S3Mock:

- session bootstrap and sample seeding;
- autosave, reload persistence, and template/accent persistence;
- resume CRUD including all child tables;
- avatar upload, signed fetch, reload persistence, and delete;
- ATS dialog rendering;
- authenticated print view and direct PDF generation;
- cloud export, S3 archive, and signed download;
- all four AI routes returning the structured `AI_NOT_CONFIGURED` envelope when no Groq key is present;
- a real Chromium smoke test against the Docker production build (hashed layout chunk served with `200`, no console, page, request, or chunk errors);
- mobile editor/preview;
- start-fresh persistence;
- standalone asset serving and the no-Chromium print fallback;
- the production Docker image running as non-root with its bundled Chromium, including direct PDF and archived PDF export.

`docs/sample-resume.pdf` is generated by the same pipeline and is a convenient one-page ATS extraction fixture.

---

Built as a production-grade reference implementation: calm on the surface, opinionated about the details underneath.
