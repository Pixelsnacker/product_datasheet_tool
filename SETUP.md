# Setup — Manus-independent operation

This app was originally generated on Manus. It has been decoupled so it can run
on your own infrastructure. It now needs exactly two external services:

1. **A MySQL database** (`DATABASE_URL`)
2. **An S3-compatible bucket** for image uploads (AWS S3 or Cloudflare R2)

Login works without Manus via a shared **team access code** (`TEAM_ACCESS_CODE`)
that signs in as the owner account. Manus OAuth is optional and left disabled.

---

## 1. Configure environment

```bash
cp .env.example .env
# then edit .env
```

Generate a session secret:

```bash
openssl rand -hex 32   # paste into JWT_SECRET
```

Minimum required for independent operation:

- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — random 32-byte hex
- `OWNER_OPEN_ID` — any stable id, e.g. `owner`
- `TEAM_ACCESS_CODE` — the login code you'll share with your team
- `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (+ `S3_ENDPOINT` for R2,
  `S3_PUBLIC_URL_BASE` for a public serving URL)

---

## 2. Database

Run the migrations, seed the owner user, and optionally seed the system templates:

```bash
pnpm install
pnpm db:migrate       # applies drizzle/ migrations
pnpm seed:owner       # creates the OWNER_OPEN_ID user (needed for team login)
pnpm seed:templates   # optional: built-in datasheet templates
```

> `seed:owner` is idempotent — running it twice is safe.

---

## 3. Run

Development (hot reload):

```bash
pnpm dev
```

Production build + start:

```bash
pnpm build
pnpm start
```

Open the app, use **Team login** and enter your `TEAM_ACCESS_CODE`.

---

## 4. Deploy on Railway

1. Create a new Railway project from the GitHub repo.
2. Add the **MySQL** plugin; copy its connection URL into `DATABASE_URL`.
3. Add all other variables from `.env.example` as service variables.
4. Storage: attach a **Volume** to the service (Railway → service → Volumes),
   mounted at e.g. `/data`, then set:
   - `UPLOAD_DIR = /data/uploads`
   - `PUBLIC_BASE_URL = https://<your-service>.up.railway.app`
     (the app's public domain — required so PDF export can load images)
5. Build command: `pnpm build` · Start command: `pnpm start`.
6. After the first deploy, run once (Railway shell or a one-off):
   `pnpm db:migrate && pnpm seed:owner`.
7. Health check endpoint: tRPC `system.health` (or just `/`).

> Puppeteer needs a Chromium runtime for PDF generation. On Railway use the
> Node image with system Chromium, or set Puppeteer's cache/executable path.
> Locally, `puppeteer` downloads its own Chromium on `pnpm install` (this was
> skipped during the decoupling work — run `pnpm exec puppeteer browsers install chrome`
> if PDF export fails).

---

## What was removed from the Manus integration

- **Storage** rewritten from the Manus "forge" proxy to the local filesystem
  (`server/storage.ts`), served by the app at `/uploads`. On Railway this is
  backed by a persistent Volume.
- Dead Manus SDK modules deleted: `server/_core/{llm,imageGeneration,
  notification,voiceTranscription,dataApi,map}.ts` (none were imported).
- `vite-plugin-manus-runtime` removed from `vite.config.ts` and dependencies;
  Manus preview hosts dropped from `allowedHosts`.
- `.manus/` query snapshots removed.
- Manus OAuth (`OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`) is now optional and
  disabled by default in favor of team-code login.
