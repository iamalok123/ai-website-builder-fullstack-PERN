# Zephyr AI Website Builder

Zephyr is a full-stack AI website builder. Users can sign in, spend credits to generate websites from prompts, request AI revisions, visually edit generated HTML, save immutable versions, roll back changes, publish projects, download HTML, and purchase credits through Stripe.

The application is split into two apps:

- `frontend`: React 19, Vite, TypeScript, Tailwind CSS.
- `backend`: Express 5, TypeScript, Prisma 7, Neon PostgreSQL, Better Auth, Stripe, OpenRouter, Inngest.

## Current Architecture

```text
Browser
  |
  | Vite SPA, Axios with credentials
  v
Frontend
  |
  | VITE_BASEURL
  v
Backend Express API
  |-- Better Auth sessions
  |-- Prisma + Neon PostgreSQL
  |-- Stripe Checkout and webhook
  |-- Inngest durable generation endpoint
  v
Neon / OpenRouter / Stripe / Inngest
```

## Key Production Behaviors

- AI generation is handled through durable `GenerationJob` records and Inngest events.
- Project creation and revision requests create the project/job/conversation/credit debit in a Prisma transaction.
- Project generation state is stored as `queued`, `running`, `completed`, or `failed`.
- Failed generation jobs store `generationError` and refund credits through the ledger.
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

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

INNGEST_DEV=1
PORT=3000
```

For production with Inngest Cloud also set:

```env
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

Keep `ENABLE_INLINE_GENERATION_FALLBACK` unset or `false` in production.

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

1. Open `http://localhost:5173`.
2. Sign up or sign in.
3. Create a new website from a prompt.
4. Backend creates a project, generation job, conversation row, and credit debit.
5. Inngest receives `website/generation.requested`.
6. The job moves from `queued` to `running` to `completed`.
7. Frontend polls the project and shows the generated website when `current_code` is ready.
8. Request a revision from the sidebar.
9. Save manual edits.
10. Roll back to a previous version.
11. Publish/unpublish and view public/community pages.

It is normal to see repeated `getUserProject completed` logs while the frontend polls generation status.

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

Backend:

```bash
cd backend
npm test
npx prisma validate
```

Frontend:

```bash
cd frontend
npx tsc -b --noEmit
npm run build
```

Targeted lint for recently changed builder files:

```bash
cd frontend
npx eslint src/pages/Projects.tsx src/components/ProjectPreview.tsx src/components/Sidebar.tsx src/types/index.ts
```

## Deployment Options

### Option A: Single Backend Service

Deploy one backend service that serves:

- Express API routes.
- Better Auth routes.
- Stripe webhook.
- Inngest endpoint at `/api/inngest`.

This is the simplest deployment.

Backend deploy commands:

```bash
cd backend
npm ci
npx prisma migrate deploy
npm run build
npm start
```

Point Inngest Cloud to:

```text
https://your-backend-domain.com/api/inngest
```

### Option B: API Plus Dedicated Worker

Deploy the API and worker separately.

API:

```bash
cd backend
npm ci
npx prisma migrate deploy
npm run build
npm start
```

Worker:

```bash
cd backend
npm ci
npm run build
npm run start:worker
```

Point Inngest Cloud to:

```text
https://your-worker-domain.com/api/inngest
```

This is better when generation load grows.

### Frontend

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
VITE_BASEURL="https://your-backend-domain.com"
```

## Production Environment Checklist

Backend:

```env
DATABASE_URL="your-neon-production-url"
BETTER_AUTH_SECRET="production-secret"
BETTER_AUTH_URL="https://your-backend-domain.com"
TRUSTED_ORIGINS="https://your-frontend-domain.com"
NODE_ENV="production"
AI_API_KEY="your-openrouter-key"
STRIPE_SECRET_KEY="your-stripe-secret"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
```

Frontend:

```env
VITE_BASEURL="https://your-backend-domain.com"
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
