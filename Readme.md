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
  | VITE_BASEURL=https://your-backend.onrender.com
  v
Render Web Service
  |-- Better Auth sessions
  |-- Prisma + Neon PostgreSQL
  |-- Stripe Checkout and webhook
  |-- Inngest durable generation endpoint
  v
Neon / OpenRouter / Stripe / Inngest
```

Current production split:

- Vercel serves only the frontend.
- Render serves the Express backend API.
- Inngest Cloud calls the Render `/api/inngest` endpoint.
- Stripe and Google OAuth callbacks point to the Render backend domain.
- Neon remains the hosted PostgreSQL database.


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

## Project Flow Diagrams

The following Mermaid diagrams document the runtime behavior of the full project and the major feature flows. They are written directly in Markdown so GitHub can render them without extra tooling.

### 1. Complete System Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Browser
    participant Frontend as Vercel React SPA
    participant API as Render Express API
    participant Auth as Better Auth
    participant DB as Neon PostgreSQL
    participant Inngest as Inngest
    participant AI as OpenRouter AI
    participant Stripe as Stripe

    User->>Browser: Open Zephyr
    Browser->>Frontend: Load Vite app
    Frontend->>API: API requests with session cookies
    API->>Auth: Validate session for protected routes
    Auth->>DB: Read user session and account data
    DB-->>Auth: Session result
    Auth-->>API: Authenticated user id
    API->>DB: Read or mutate projects, credits, versions
    API->>Inngest: Queue generation events when AI work is needed
    Inngest->>API: Call /api/inngest function handler
    API->>AI: Generate or revise website HTML
    AI-->>API: Complete HTML response
    API->>DB: Save sanitized code, version, job status, ledger entries
    API-->>Frontend: Project status and data
    Frontend-->>Browser: Render builder, preview, community, pricing, and account pages
    User->>Stripe: Buy credits from checkout when needed
    Stripe->>API: Send signed webhook to /api/stripe
    API->>DB: Mark transaction paid and add purchased credits
```

### 2. Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React Auth Page
    participant API as Express /api/auth
    participant BetterAuth as Better Auth
    participant Google as Google OAuth
    participant DB as User, Session, Account tables

    alt Email and password
        User->>Frontend: Submit credentials
        Frontend->>API: POST /api/auth/sign-in or sign-up
        API->>BetterAuth: Process auth request
        BetterAuth->>DB: Create or verify User, Account, Session
        DB-->>BetterAuth: Auth records
        BetterAuth-->>API: Session cookie and user data
        API-->>Frontend: Auth success
    else Google OAuth
        User->>Frontend: Continue with Google
        Frontend->>API: Start OAuth flow
        API->>BetterAuth: Build Google authorization request
        BetterAuth->>Google: Redirect user to Google consent
        Google-->>API: Callback with authorization state
        API->>BetterAuth: Validate callback
        BetterAuth->>DB: Upsert User and Account, create Session
        BetterAuth-->>Frontend: Redirect to frontend app URL
    end

    Frontend->>API: Protected API request
    API->>BetterAuth: Validate session cookie
    BetterAuth->>DB: Lookup Session by token
    DB-->>BetterAuth: Session and User
    BetterAuth-->>API: req.userId
```

### 3. Initial Website Generation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Home as Hero Prompt Composer
    participant API as POST /api/user/project
    participant ProjectService as Project Service
    participant DB as Neon PostgreSQL
    participant CreditService as Credit Service
    participant Inngest as Inngest Event
    participant Worker as process-website-generation
    participant AI as OpenRouter
    participant Builder as Builder Page

    User->>Home: Enter website prompt
    Home->>API: Create project request
    API->>ProjectService: createProjectWithGenerationJob(userId, prompt)
    ProjectService->>DB: Start transaction
    DB->>ProjectService: Load user credits
    ProjectService->>DB: Create WebsiteProject with queued status
    ProjectService->>DB: Create GenerationJob type initial
    ProjectService->>DB: Create user Conversation message
    ProjectService->>CreditService: Debit 5 credits
    CreditService->>DB: Update User credits and create CreditLedger debit
    ProjectService->>DB: Commit transaction
    ProjectService->>Inngest: Send website/generation.requested
    API-->>Home: 202 with projectId and jobId
    Home->>Builder: Navigate to /projects/:projectId
    Builder->>API: Poll GET /api/user/project/:projectId
    Inngest->>Worker: Run generation function
    Worker->>DB: Claim queued job and mark project running
    Worker->>AI: Enhance prompt
    Worker->>DB: Store enhanced prompt and assistant messages
    Worker->>AI: Generate complete HTML
    Worker->>DB: Save Version, current_code, completed job status
    Builder->>API: Poll latest project
    API-->>Builder: completed project with current_code and versions
    Builder-->>User: Editable iframe, save, preview, download, publish controls
```

### 4. AI Revision Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Sidebar as Builder Sidebar
    participant API as POST /api/project/revision/:projectId
    participant ProjectService as Project Service
    participant DB as Neon PostgreSQL
    participant CreditService as Credit Service
    participant Inngest as Inngest
    participant Worker as Generation Worker
    participant AI as OpenRouter
    participant Preview as Project Preview iframe

    User->>Sidebar: Submit revision prompt
    Sidebar->>API: Request revision
    API->>ProjectService: createRevisionGenerationJob(userId, projectId, message)
    ProjectService->>DB: Validate project ownership and current_code
    ProjectService->>DB: Reject if queued or running
    ProjectService->>DB: Create GenerationJob type revision
    ProjectService->>DB: Create user Conversation message
    ProjectService->>DB: Set project generationStatus to queued
    ProjectService->>CreditService: Debit 5 credits
    CreditService->>DB: Update User credits and CreditLedger
    ProjectService->>Inngest: Send website/generation.requested
    API-->>Sidebar: 202 revision queued
    Sidebar->>API: Poll GET /api/user/project/:projectId
    Inngest->>Worker: Execute job
    Worker->>DB: Mark job and project running
    Worker->>AI: Enhance revision instruction
    Worker->>AI: Generate revised HTML using existing current_code
    Worker->>DB: Create new Version and update current_code
    API-->>Sidebar: Project completed with new version
    Sidebar-->>Preview: Render revised website
```

### 5. Visual Edit, Save, And Rollback Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Preview as ProjectPreview iframe
    participant Editor as EditorPanel
    participant Builder as Builder Page
    participant API as Project API
    participant DB as WebsiteProject and Version tables

    User->>Preview: Click editable element inside iframe
    Preview->>Builder: postMessage ELEMENT_SELECTED
    Builder->>Editor: Open element controls
    User->>Editor: Change text, classes, or inline styles
    Editor->>Preview: postMessage UPDATE_ELEMENT
    Preview-->>User: Live iframe updates
    User->>Builder: Click Save
    Builder->>Preview: Read cleaned document HTML
    Builder->>API: PUT /api/project/save/:projectId
    API->>DB: Validate ownership and completed generation state
    API->>DB: Create Version with Manual save description
    API->>DB: Update current_code and currentVersionId
    API-->>Builder: Project saved successfully

    User->>Builder: Select older version rollback
    Builder->>API: GET /api/project/rollback/:projectId/:versionId
    API->>DB: Validate version belongs to project
    API->>DB: Replace current_code with selected Version.code
    API->>DB: Create assistant Conversation message
    API-->>Builder: Rollback success
    Builder->>API: Refresh project
    API-->>Builder: Current project points to restored version
```

### 6. Publish, Preview, And Community Flow

```mermaid
sequenceDiagram
    autonumber
    actor Owner
    actor Visitor
    participant Builder as Builder Page
    participant Preview as Preview Page
    participant Community as Community Page
    participant View as Public View Page
    participant API as Express Project API
    participant DB as Neon PostgreSQL
    participant Sanitizer as HTML Sanitizer

    Owner->>Builder: Click Preview
    Builder->>Preview: Open /preview/:projectId
    Preview->>API: GET /api/project/preview/:projectId
    API->>DB: Verify owner and load current_code plus versions
    API-->>Preview: Private preview data

    Owner->>Builder: Toggle publish
    Builder->>API: GET /api/user/publish-toggle/:projectId
    API->>DB: Validate owner and completed generated code
    API->>DB: Flip isPublished
    API-->>Builder: Published or unpublished message

    Visitor->>Community: Open /community
    Community->>API: GET /api/project/published
    API->>DB: Load completed published projects
    API->>Sanitizer: Sanitize public HTML previews
    API-->>Community: Published project cards
    Visitor->>View: Open /view/:projectId
    View->>API: GET /api/project/published/:projectId
    API->>DB: Load published completed project code
    API->>Sanitizer: Sanitize public HTML
    API-->>View: Public website HTML
```

### 7. Credit Purchase And Stripe Webhook Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Pricing as Pricing Page
    participant API as POST /api/user/purchase-credits
    participant PaymentService as Payment Service
    participant Stripe as Stripe Checkout
    participant Webhook as POST /api/stripe
    participant DB as Transaction and CreditLedger tables
    participant CreditService as Credit Service

    User->>Pricing: Choose credit plan
    Pricing->>API: Submit planId
    API->>DB: Create Transaction with isPaid false
    API->>PaymentService: createCreditCheckoutSession
    PaymentService->>Stripe: Create checkout session with transaction metadata
    Stripe-->>API: Checkout URL
    API-->>Pricing: payment_link
    Pricing-->>User: Redirect to Stripe Checkout
    User->>Stripe: Complete payment
    Stripe->>Webhook: payment_intent.succeeded
    Webhook->>Stripe: Retrieve checkout session by payment_intent
    Stripe-->>Webhook: Session metadata with transactionId
    Webhook->>DB: Start transaction
    DB-->>Webhook: Load Transaction
    Webhook->>DB: Skip if missing or already paid
    Webhook->>DB: Mark Transaction isPaid true
    Webhook->>CreditService: recordCreditPurchase
    CreditService->>DB: Increment User credits and create purchase ledger entry
    Webhook-->>Stripe: received true
```

### 8. Failure, Timeout, And Retry Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Builder as Builder Page
    participant API as Project API
    participant Worker as Generation Worker
    participant AI as OpenRouter
    participant DB as GenerationJob, WebsiteProject, CreditLedger
    participant CreditService as Credit Service
    participant Inngest as Inngest

    Worker->>AI: Request prompt enhancement or HTML generation
    alt AI error or timeout
        AI-->>Worker: Error, invalid HTML, auth failure, or timeout
        Worker->>DB: Mark GenerationJob failed
        Worker->>DB: Mark WebsiteProject failed with generationError
        Worker->>DB: Create assistant error Conversation message
        Worker->>CreditService: Refund 5 credits
        CreditService->>DB: Increment User credits and create refund ledger entry
    else Poll detects stale active job
        Builder->>API: GET /api/user/project/:projectId
        API->>DB: Find active queued or running job
        API->>DB: Compare createdAt, startedAt, or updatedAt with timeout
        API->>DB: Mark stale job failed
        API->>CreditService: Refund credits
    end

    API-->>Builder: failed project with generationError
    User->>Builder: Click Retry generation
    Builder->>API: POST /api/project/retry/:projectId
    API->>DB: Find latest failed job
    API->>DB: Create new queued GenerationJob using failed prompt and type
    API->>CreditService: Debit 5 credits
    API->>Inngest: Queue website/generation.requested
    API-->>Builder: Retry queued
```

## Database Schema Diagram

The database uses Prisma models backed by Neon PostgreSQL. `GenerationJob` stores durable AI work, `Version` stores immutable HTML snapshots, and `CreditLedger` provides an auditable credit history for debits, refunds, and purchases.

```mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string name
        string image
        int totalCreation
        int credits
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
    }

    WEBSITE_PROJECT {
        string id PK
        string name
        string initial_prompt
        string current_code
        string current_version_index
        string currentVersionId
        string generationStatus
        string generationError
        string userId FK
        boolean isPublished
        datetime createdAt
        datetime updatedAt
    }

    CONVERSATION {
        string id PK
        string role
        string content
        datetime timestamp
        string projectId FK
    }

    VERSION {
        string id PK
        string code
        string description
        datetime timestamp
        string projectId FK
    }

    GENERATION_JOB {
        string id PK
        string type
        string status
        string prompt
        string enhancedPrompt
        string error
        int attempts
        string userId FK
        string projectId FK
        datetime startedAt
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    CREDIT_LEDGER {
        string id PK
        string type
        int amount
        string reason
        int balanceAfter
        string userId FK
        string projectId FK
        string transactionId FK
        string jobId
        datetime createdAt
    }

    TRANSACTION {
        string id PK
        boolean isPaid
        string planId
        float amount
        int credits
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    SESSION {
        string id PK
        datetime expiresAt
        string token UK
        datetime createdAt
        datetime updatedAt
        string ipAddress
        string userAgent
        string userId FK
    }

    ACCOUNT {
        string id PK
        string accountId
        string providerId
        string userId FK
        string accessToken
        string refreshToken
        string idToken
        datetime accessTokenExpiresAt
        datetime refreshTokenExpiresAt
        string scope
        string password
        datetime createdAt
        datetime updatedAt
    }

    VERIFICATION {
        string id PK
        string identifier
        string value
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }

    USER ||--o{ WEBSITE_PROJECT : owns
    USER ||--o{ SESSION : authenticates
    USER ||--o{ ACCOUNT : links
    USER ||--o{ TRANSACTION : purchases
    USER ||--o{ GENERATION_JOB : starts
    USER ||--o{ CREDIT_LEDGER : records
    WEBSITE_PROJECT ||--o{ CONVERSATION : contains
    WEBSITE_PROJECT ||--o{ VERSION : snapshots
    WEBSITE_PROJECT ||--o{ GENERATION_JOB : tracks
    WEBSITE_PROJECT ||--o{ CREDIT_LEDGER : references
    TRANSACTION ||--o{ CREDIT_LEDGER : creates
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
INNGEST_SERVE_ORIGIN="https://your-backend.onrender.com"
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

For production:

```env
VITE_BASEURL="https://your-backend.onrender.com"
VITE_APP_URL="https://your-frontend.vercel.app"
```

Vite embeds frontend environment variables during build. If you change `VITE_BASEURL` or `VITE_APP_URL` in Vercel, redeploy the frontend.

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

## Vercel Frontend + Render Backend Production Prep

This repository is currently prepared for:

- Frontend: Vercel static Vite app from the `frontend` directory.
- Backend: Render Web Service from the `backend` directory.
- Database: Neon PostgreSQL.
- Jobs: Inngest Cloud calling the backend at `/api/inngest`.
- Payments: Stripe calling the backend at `/api/stripe`.

For Render health checks, the backend exposes:

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

Last verified locally on May 20, 2026:

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

Before pushing to production GitHub, run this final check set:

```bash
cd backend
npm test
npx prisma validate
npm audit --omit=dev --audit-level=high

cd ../frontend
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

Expected current audit result:

- Frontend: `0 vulnerabilities`.
- Backend: no high-severity production audit failures. Moderate Prisma dev-tooling advisory may remain unless Prisma releases a compatible patched line.

## Deployment: Vercel Frontend + Render Backend

### 1. Prepare Production Domains

Current recommended setup:

```text
Frontend: https://your-frontend.vercel.app
Backend:  https://your-backend.onrender.com
Inngest:  https://your-backend.onrender.com/api/inngest
Stripe:   https://your-backend.onrender.com/api/stripe
Google:   https://your-backend.onrender.com/api/auth/callback/google
Health:   https://your-backend.onrender.com/health
```

Replace the example URLs with your real Vercel and Render URLs. If you later add custom domains, update every dependent service and redeploy the frontend because Vite envs are build-time values.

### 2. Deploy Backend On Render

Create a Render Web Service from the GitHub repository.

Render settings:

```text
Service Type: Web Service
Root Directory: backend
Runtime: Node
Build Command: npm ci && npx prisma generate && npm run build
Start Command: npm run start
Health Check Path: /health
Auto Deploy: enabled if you want every main branch push to deploy
```

Node version:

- `backend/package.json` already sets `"node": "22.x"` in `engines`.
- If Render asks for an explicit env var, set `NODE_VERSION=22`.

Backend production environment variables in Render:

```env
NODE_ENV=production
DATABASE_URL="your-neon-production-url"

BETTER_AUTH_SECRET="long-production-secret"
BETTER_AUTH_URL="https://your-backend.onrender.com"
TRUSTED_ORIGINS="https://your-frontend.vercel.app"

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
INNGEST_SERVE_ORIGIN="https://your-backend.onrender.com"
INNGEST_SERVE_PATH="/api/inngest"
```

Important Render notes:

- Do not upload `.env` files to Render. Add variables in Render Dashboard.
- Render provides the runtime `PORT` automatically; the code already reads `process.env.PORT`.
- Render's default web service port is `10000`, but you usually do not need to set it manually.
- Keep `INNGEST_DEV` unset in Render production.
- Keep `ENABLE_INLINE_GENERATION_FALLBACK` unset or `false` in Render production.
- If you use Vercel preview deployments, add every allowed frontend origin to `TRUSTED_ORIGINS`, comma separated.

Apply database migrations:

```bash
cd backend
npx prisma migrate deploy
```

Run migrations from your local machine using the production Neon `DATABASE_URL`, from Render Shell, or with a Render pre-deploy command if your Render plan/workflow supports it. Do not use `migrate dev` against production.

After Render deploys, verify:

```text
https://your-backend.onrender.com/
https://your-backend.onrender.com/health
```

Expected health response:

```json
{ "status": "ok" }
```

### 3. Deploy Frontend On Vercel

Create a Vercel project from the same GitHub repository.

Vercel settings:

```text
Root Directory: frontend
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
```

Frontend production environment variables in Vercel:

```env
VITE_BASEURL="https://your-backend.onrender.com"
VITE_APP_URL="https://your-frontend.vercel.app"
```

The existing `frontend/vercel.json` rewrites all routes to `index.html`, which is required for React Router deep links such as `/projects`, `/pricing`, and `/auth/sign-in`.

After changing `VITE_BASEURL` or `VITE_APP_URL`, redeploy the frontend in Vercel.

### 4. Configure Inngest Cloud

Inngest functions are served by Express at `/api/inngest` using the official `serve()` handler from `inngest/express`.

1. Create an Inngest app.
2. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to Render environment variables.
3. Sync the deployed endpoint:

```text
https://your-backend.onrender.com/api/inngest
```

4. Confirm Inngest sees `process-website-generation`.
5. Run a generation and watch the Inngest run logs.

### 5. Configure Google OAuth

In Google Cloud Console, add:

Authorized JavaScript origins:

```text
https://your-frontend.vercel.app
https://your-backend.onrender.com
```

Authorized redirect URI:

```text
https://your-backend.onrender.com/api/auth/callback/google
```

If you see `state mismatch` after Google OAuth:

1. Confirm `BETTER_AUTH_URL` exactly matches the Render backend origin.
2. Confirm `VITE_BASEURL` exactly matches the Render backend origin.
3. Confirm `VITE_APP_URL` exactly matches the Vercel frontend origin.
4. Confirm both frontend and backend origins are in `TRUSTED_ORIGINS`.
5. Redeploy both services after env changes.

### 6. Configure Stripe

Set Stripe webhook endpoint:

```text
https://your-backend.onrender.com/api/stripe
```

Copy the webhook secret to:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

After setting the webhook secret in Render, redeploy or restart the backend.

## Production Environment Checklist

Backend:

```env
DATABASE_URL="your-neon-production-url"
BETTER_AUTH_SECRET="production-secret"
BETTER_AUTH_URL="https://your-backend.onrender.com"
TRUSTED_ORIGINS="https://your-frontend.vercel.app"
NODE_ENV="production"
AI_API_KEY="your-openrouter-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
STRIPE_SECRET_KEY="your-stripe-secret"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
INNGEST_SERVE_ORIGIN="https://your-backend.onrender.com"
INNGEST_SERVE_PATH="/api/inngest"
GENERATION_TIMEOUT_MS=480000
REVISION_TIMEOUT_MS=240000
AI_REQUEST_TIMEOUT_MS=120000
PRISMA_TRANSACTION_TIMEOUT_MS=30000
ENABLE_REVISION_PROMPT_ENHANCEMENT=false
```

Frontend:

```env
VITE_BASEURL="https://your-backend.onrender.com"
VITE_APP_URL="https://your-frontend.vercel.app"
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

