#!/bin/sh
# Container entrypoint: fail fast on missing required configuration and warn
# loudly about optional features that would otherwise degrade silently.
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[vellum] FATAL: DATABASE_URL is not set. The app cannot start without PostgreSQL." >&2
  exit 1
fi

if [ -z "${GROQ_API_KEY:-}" ]; then
  echo "[vellum] WARN: GROQ_API_KEY is not set. AI actions will return AI_NOT_CONFIGURED." >&2
fi

if [ -z "${S3_BUCKET:-}" ]; then
  echo "[vellum] WARN: S3_BUCKET is not set. Avatars and archived PDF exports will fail." >&2
fi

if [ -z "${APP_URL:-}" ]; then
  echo "[vellum] WARN: APP_URL is not set. PDF rendering will fall back to the request origin." >&2
fi

if [ "${APP_URL:-}" = "http://localhost:3000" ]; then
  echo "[vellum] WARN: APP_URL is still localhost. Set it to the EC2 public URL for correct PDF links." >&2
fi

case "${APP_URL:-}" in
  *localhost* | *127.0.0.1*) ;;
  *)
    case "${S3_PUBLIC_ENDPOINT:-}" in
      *localhost* | *127.0.0.1*)
        echo "[vellum] WARN: S3_PUBLIC_ENDPOINT points at localhost while APP_URL is public. Signed download URLs will not work from the browser." >&2
        ;;
    esac
    ;;
esac

case "${APP_URL:-}${S3_PUBLIC_ENDPOINT:-}" in
  *"<"*)
    echo "[vellum] WARN: APP_URL or S3_PUBLIC_ENDPOINT still contains a <placeholder>. Edit .env before exposing the app." >&2
    ;;
esac

echo "[vellum] Starting ${NODE_ENV:-production} on port ${PORT:-3000}"
exec "$@"
