# syntax=docker/dockerfile:1.7

# ── Build ────────────────────────────────────────────────────────────────────
# A single build stage keeps the image portable across Docker builders. The
# runtime image only receives the traced standalone output, so dev tooling and
# the full node_modules tree never ship to production.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CHROME_EXECUTABLE_PATH=/usr/bin/chromium

# Chromium powers server-side PDF export. The bundled resume fonts ship with
# the app, so font packages are only a fallback for third-party glyphs.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      chromium \
      ca-certificates \
      fonts-liberation \
      tini \
 && rm -rf /var/lib/apt/lists/*

# Chromium needs a writable home directory for its profile and Crashpad
# database. A non-root system account without one fails at launch.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs \
      --create-home --home-dir /home/nextjs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
