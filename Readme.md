# Zephyr AI Website Builder

Zephyr is a full-stack AI website builder. Users can sign in, spend credits to generate websites from prompts, request AI revisions, visually edit generated HTML, save immutable versions, roll back changes, publish projects, download HTML, and purchase credits through Stripe.

The application is split into two apps:

- `frontend`: React 19, Vite, TypeScript, Tailwind CSS.
- `backend`: Express 5, TypeScript, Prisma 7, Neon PostgreSQL, Better Auth, Stripe, OpenRouter, Inngest.

## Production Architecture

```text
Browser / Mobile Browser
  |
  | Vercel static Vite SPA
  v
Frontend
  |
  | VITE_BASEURL=https://api.yourdomain.com
  v
EC2 Backend behind Nginx HTTPS
  |-- Better Auth sessions
  |-- Prisma + Neon PostgreSQL
  |-- Stripe Checkout and webhook
  |-- Inngest durable generation endpoint
  |-- Optional dedicated worker process for /api/inngest
  v
Neon / OpenRouter / Stripe / Inngest
```

Recommended production split:

- Vercel serves only the frontend.
- EC2 serves the Express API.
- Inngest Cloud calls the EC2 `/api/inngest` endpoint.
- Stripe and Google OAuth callbacks also point to the EC2 backend domain.

## Key Production Behaviors

- AI generation is handled through durable `GenerationJob` records and Inngest events.
- Project creation and revision requests create the project/job/conversation/credit debit in a Prisma transaction.
- Project generation state is stored as `queued`, `running`, `completed`, or `failed`.
- Failed generation jobs store `generationError` and refund credits through the ledger.
- Generation is capped by `GENERATION_TIMEOUT_MS`; default is 8 minutes.
- Revision jobs are capped by `REVISION_TIMEOUT_MS`; default is 4 minutes.
- Individual OpenRouter requests are capped by `AI_REQUEST_TIMEOUT_MS`; default is 2 minutes.
- Revisions skip the extra prompt-enhancement AI call by default for faster edit turnaround.
- Failed generation jobs can be retried from the builder without retyping the prompt.
- Credit changes are recorded in `CreditLedger` for debits, refunds, and purchases.
- Generated and manually saved HTML creates immutable `Version` snapshots.
- Public preview responses are selected-field responses and use stricter HTML sanitization.
- The frontend polls real generation status instead of guessing only from `current_code`.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express 5, TypeScript |
| Database | Neon PostgreSQL |
| ORM | Prisma 7 |
| Auth | Better Auth |
| AI | OpenRouter through OpenAI SDK |
| Jobs | Inngest |
| Payments | Stripe |

## Project Structure

```text
.
├── backend/
│   ├── controllers/          # HTTP controllers
│   ├── services/             # Business logic for generation, projects, credits, payments
│   ├── inngest/              # Durable job functions
│   ├── lib/                  # Prisma, auth, validation, Inngest client, sanitization
│   ├── middlewares/          # Auth, validation, rate limiting
│   ├── prisma/               # Prisma schema and migrations
│   ├── routes/               # Express routes
│   ├── tests/                # Node test runner tests
│   ├── server.ts             # API entrypoint
│   └── worker.ts             # Optional dedicated Inngest worker entrypoint
├── frontend/
│   └── src/
│       ├── components/       # Builder, preview, editor, layout components
│       ├── pages/            # App routes
│       ├── sections/         # Landing/pricing sections
│       ├── configs/          # Axios config
│       └── lib/              # Auth client and utilities
├── ChatGPT.md                # Architecture context for future agent work
└── Readme.md
```

## Environment Variables

Do not commit real `.env` files. They are ignored by git.

### Backend `backend/.env`

For local development with Neon:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require"

BETTER_AUTH_SECRET="generate-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
TRUSTED_ORIGINS="http://localhost:5173"
NODE_ENV="development"

AI_API_KEY="your-openrouter-api-key"

GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

INNGEST_DEV=1
PORT=3000
GENERATION_TIMEOUT_MS=480000
REVISION_TIMEOUT_MS=240000
AI_REQUEST_TIMEOUT_MS=120000
PRISMA_TRANSACTION_TIMEOUT_MS=30000
ENABLE_REVISION_PROMPT_ENHANCEMENT=false
```

For production with Inngest Cloud also set:

```env
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
INNGEST_SERVE_ORIGIN="https://api.yourdomain.com"
INNGEST_SERVE_PATH="/api/inngest"
```

Keep `ENABLE_INLINE_GENERATION_FALLBACK` unset or `false` in production.
Keep `INNGEST_DEV` unset or `0` in production; use `INNGEST_DEV=1` only with the local Inngest Dev Server.

### Frontend `frontend/.env`

```env
VITE_BASEURL="http://localhost:3000"
VITE_APP_URL="http://localhost:5173"
```

`VITE_BASEURL` is the important runtime value currently used by the frontend.

## Neon And Prisma

This project uses Neon PostgreSQL. You do not need a local Postgres server if `DATABASE_URL` points to Neon.

Use the correct Prisma command for the database you are targeting:

```bash
# Shared, staging, or production Neon database
npx prisma migrate deploy

# Disposable local/dev Neon branch only
npx prisma migrate dev
```

Recommended safe workflow:

1. Create a Neon development branch.
2. Put that branch connection string in `backend/.env`.
3. Run migrations against the dev branch first.
4. Test locally.
5. Deploy code.
6. Run `npx prisma migrate deploy` against staging/production during deployment.

## Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

Generate Prisma client after installing backend dependencies:

```bash
cd backend
npx prisma generate
```

Apply migrations to your Neon dev branch:

```bash
cd backend
npx prisma migrate deploy
```

## Run Locally

Stop old terminals first with `Ctrl + C`.

### Terminal 1: Backend

```cmd
cd /d C:\Users\LENOVO\Desktop\Full_Stack_Projects\AI_Website_Builder_PERN_Full_Stack_Project\backend
npm run dev
```

Backend runs at:

```text
http://localhost:3000
```

### Terminal 2: Inngest Dev Server

```cmd
cd /d C:\Users\LENOVO\Desktop\Full_Stack_Projects\AI_Website_Builder_PERN_Full_Stack_Project\backend
npm run inngest:dev
```

Inngest dashboard:

```text
http://localhost:8288
```

### Terminal 3: Frontend

```cmd
cd /d C:\Users\LENOVO\Desktop\Full_Stack_Projects\AI_Website_Builder_PERN_Full_Stack_Project\frontend
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Local Flow To Test

Use this full manual checklist before deploying and again after staging deployment.

### 1. Health And Services

1. Open `http://localhost:3000/health`.
2. Open `http://localhost:8288`.
3. Open `http://localhost:5173`.
4. Confirm the backend, Inngest dev server, and frontend are all running.

### 2. Auth

1. Sign up with email/password.
2. Sign out.
3. Sign in again.
4. If Google keys are configured, test `Continue with Google`.
5. Confirm the navbar shows the authenticated user.

### 3. Initial Generation

1. Create a website from the home prompt box.
2. Confirm the builder opens immediately.
3. Confirm Save, Preview, Download, Publish, and Rollback are disabled while generating.
4. Confirm Inngest receives `website/generation.requested`.
5. Confirm the project moves from `queued` to `running` to `completed`.
6. Confirm the generated website renders in desktop, tablet, and phone preview widths.
7. Confirm Save, Preview, Download, Publish, and Rollback become enabled after generation completes.

### 4. Failure And Retry

Use a staging database or local dev branch for this test.

1. Temporarily set `GENERATION_TIMEOUT_MS=60000`.
2. Temporarily use an invalid `AI_API_KEY`, or interrupt the backend/Inngest process during generation.
3. Create a project.
4. Confirm the project eventually becomes `failed` instead of loading forever.
5. Confirm credits are restored.
6. Restore the valid `AI_API_KEY`.
7. Click `Retry generation`.
8. Confirm a new generation starts without retyping the prompt.
9. Confirm the project completes and actions become enabled.

If generation fails immediately with `AI provider authentication failed` or OpenRouter logs `401 User not found`, rotate `AI_API_KEY` in OpenRouter, update `backend/.env`, restart the backend and Inngest dev server, then click `Retry generation`. This is an AI provider key/account problem, not a Better Auth user problem.

### 5. Builder Features

1. Click/edit an element in the generated iframe.
2. Save.
3. Confirm a new version appears in the sidebar.
4. Submit a revision prompt.
5. Confirm actions disable during revision and re-enable after completion.
6. Roll back to an older version.
7. Confirm the iframe updates to the selected version.

### 6. Preview, Download, Publish

1. Open Preview.
2. Download `index.html`.
3. Open the downloaded HTML locally in a browser.
4. Publish the project.
5. Open `/view/:projectId`.
6. Open `/community` and confirm the published project appears.
7. Unpublish and confirm it no longer appears publicly.

### 7. Stripe Credits

1. Start Stripe checkout from `/pricing`.
2. Use Stripe test mode locally or staging.
3. Forward webhooks with `stripe listen --forward-to localhost:3000/api/stripe`.
4. Confirm credits are added once after successful payment.

It is normal to see repeated `getUserProject completed` logs while the frontend polls generation status.

## Vercel Frontend + EC2 Backend Production Prep

The production deployment plan and local pre-deployment checklist are documented in:

```text
docs/vercel-frontend-ec2-backend-production-plan.md
```

For EC2 health checks, the backend exposes:

```text
GET /health
```

Generation is capped by `GENERATION_TIMEOUT_MS`; the default is 8 minutes. Revision jobs are capped by `REVISION_TIMEOUT_MS`; the default is 4 minutes. Individual AI requests are capped by `AI_REQUEST_TIMEOUT_MS`; the default is 2 minutes.

## Stripe Local Testing

Stripe checkout can be started locally if Stripe keys are configured.

For webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe
```

Copy the generated `whsec_...` into `backend/.env` as `STRIPE_WEBHOOK_SECRET`, then restart the backend.

## API Overview

### Auth

Better Auth is mounted under:

```text
/api/auth/*
```

Email/password and Google OAuth are enabled. For local Google OAuth, configure Google Cloud Console with:

```text
Authorized JavaScript origins:
http://localhost:5173
http://localhost:3000

Authorized redirect URI:
http://localhost:3000/api/auth/callback/google
```

Keep `VITE_APP_URL` set to the frontend origin (`http://localhost:5173` locally, Vercel/custom frontend domain in production). The backend `BETTER_AUTH_URL` stays on the API origin; `VITE_APP_URL` is what sends the user back to the React auth callback screen after Google completes.

Implementation details are documented in `docs/google-oauth-implementation.md`.

### User

```http
GET    /api/user/credits
POST   /api/user/project
GET    /api/user/project/:projectId
GET    /api/user/projects
GET    /api/user/publish-toggle/:projectId
POST   /api/user/purchase-credits
```

### Project

```http
POST   /api/project/revision/:projectId
POST   /api/project/retry/:projectId
PUT    /api/project/save/:projectId
GET    /api/project/rollback/:projectId/:versionId
DELETE /api/project/:projectId
GET    /api/project/preview/:projectId
GET    /api/project/published
GET    /api/project/published/:projectId
```

### Jobs

```http
POST /api/inngest
GET  /api/inngest
PUT  /api/inngest
```

Handled by Inngest's Express adapter.

### Webhooks

```http
POST /api/stripe
```

Stripe webhook uses raw request body and must remain registered before `express.json()`.

## Verification

Last verified locally on May 11, 2026:

```bash
cd backend
npm test
npx prisma validate

cd ../frontend
npm run lint
npx tsc -b --noEmit
npm run build
```

The frontend production build currently succeeds and reports a Vite chunk-size warning for the main JavaScript bundle. This is not a build failure; consider route-level code splitting as the app grows.

Backend:

```bash
cd backend
npm test
npx prisma validate
```

Frontend:

```bash
cd frontend
npm run lint
npx tsc -b --noEmit
npm run build
```

Local browser smoke test: the built frontend was served from `frontend/dist` and the landing page rendered with no browser console errors.

## Deployment: Vercel Frontend + EC2 Backend

### 1. Prepare Production Domains

Recommended:

```text
Frontend: https://app.yourdomain.com
Backend:  https://api.yourdomain.com
Inngest:  https://api.yourdomain.com/api/inngest
Stripe:   https://api.yourdomain.com/api/stripe
Google:   https://api.yourdomain.com/api/auth/callback/google
Health:   https://api.yourdomain.com/health
```

You can deploy first with the Vercel preview domain and EC2 public DNS, but custom HTTPS domains are strongly recommended before real users.

### 2. Deploy Backend On EC2

Install runtime packages on the EC2 instance:

```bash
sudo apt update
sudo apt install -y nodejs npm nginx git
sudo npm install -g pm2
```

Clone or pull the project:

```bash
git clone <your-repo-url>
cd AI_Website_Builder_PERN_Full_Stack_Project/backend
```

Create `backend/.env` from `backend/.env.example` and set production values:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="your-neon-production-url"

BETTER_AUTH_SECRET="long-production-secret"
BETTER_AUTH_URL="https://api.yourdomain.com"
TRUSTED_ORIGINS="https://app.yourdomain.com,https://your-vercel-app.vercel.app"

AI_API_KEY="your-openrouter-key"
GENERATION_TIMEOUT_MS=480000
REVISION_TIMEOUT_MS=240000
AI_REQUEST_TIMEOUT_MS=120000
PRISMA_TRANSACTION_TIMEOUT_MS=30000
ENABLE_REVISION_PROMPT_ENHANCEMENT=false

GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
INNGEST_SERVE_ORIGIN="https://api.yourdomain.com"
INNGEST_SERVE_PATH="/api/inngest"
```

Install, migrate, build, and start:

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 start dist/server.js --name zephyr-api
pm2 save
pm2 startup
```

If you want to isolate generation from API traffic, run the worker separately:

```bash
pm2 start dist/worker.js --name zephyr-worker
pm2 save
```

For a single-process deployment, `dist/server.js` is enough because it also serves `/api/inngest`.

### 3. Configure Nginx On EC2

Basic single-process reverse proxy:

```nginx
server {
    server_name api.yourdomain.com;

    client_max_body_size 50m;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If using the dedicated worker on port `3001`, route Inngest to it:

```nginx
location /api/inngest {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Enable the site, reload Nginx, and install HTTPS certificates with Certbot or your preferred SSL provider.

Check:

```bash
curl https://api.yourdomain.com/health
```

Expected:

```json
{ "status": "ok" }
```

### 4. Configure Inngest Cloud

Inngest functions are served by Express at `/api/inngest` using the official `serve()` handler from `inngest/express`.

1. Create an Inngest app.
2. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to EC2 `.env`.
3. Sync the deployed endpoint:

```text
https://api.yourdomain.com/api/inngest
```

4. Confirm Inngest sees `process-website-generation`.
5. Run a generation and watch the Inngest run logs.

### 5. Configure Google OAuth

In Google Cloud Console, add:

Authorized JavaScript origins:

```text
https://app.yourdomain.com
https://api.yourdomain.com
```

Authorized redirect URI:

```text
https://api.yourdomain.com/api/auth/callback/google
```

### 6. Configure Stripe

Set Stripe webhook endpoint:

```text
https://api.yourdomain.com/api/stripe
```

Copy the webhook secret to:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 7. Deploy Frontend On Vercel

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Production env:

```env
VITE_BASEURL="https://api.yourdomain.com"
VITE_APP_URL="https://app.yourdomain.com"
```

Vercel uses build-time environment variables for Vite, so any change to `VITE_BASEURL` requires a new frontend deployment.

Vercel project settings:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

The existing `frontend/vercel.json` rewrites all routes to `index.html`, which is required for React Router deep links.

## Production Environment Checklist

Backend:

```env
DATABASE_URL="your-neon-production-url"
BETTER_AUTH_SECRET="production-secret"
BETTER_AUTH_URL="https://your-backend-domain.com"
TRUSTED_ORIGINS="https://your-frontend-domain.com"
NODE_ENV="production"
AI_API_KEY="your-openrouter-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
STRIPE_SECRET_KEY="your-stripe-secret"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
INNGEST_SERVE_ORIGIN="https://your-backend-domain.com"
INNGEST_SERVE_PATH="/api/inngest"
GENERATION_TIMEOUT_MS=480000
REVISION_TIMEOUT_MS=240000
AI_REQUEST_TIMEOUT_MS=120000
PRISMA_TRANSACTION_TIMEOUT_MS=30000
ENABLE_REVISION_PROMPT_ENHANCEMENT=false
```

Frontend:

```env
VITE_BASEURL="https://your-backend-domain.com"
VITE_APP_URL="https://your-frontend-domain.com"
```

## Commit Message

Recommended commit message for the current persistence and architecture work:

```text
Add durable generation jobs and credit ledger
```

## Security Notes

- Generated HTML is untrusted. Keep iframe sandboxing strict, especially in public/community views.
- Do not expose full user/project records from public APIs.
- Do not use `ENABLE_INLINE_GENERATION_FALLBACK` in production.
- Use Neon development branches for local testing.
- Rotate any secret that was accidentally shared or committed.
- Keep Stripe webhook verification enabled.

## Acknowledgements

- React
- Vite
- Tailwind CSS
- Express
- Prisma
- Neon
- Better Auth
- OpenRouter
- Inngest
- Stripe
