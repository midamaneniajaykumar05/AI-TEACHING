# TeacherGPT

An AI-powered Python Full Stack mentor. Uses Socratic teaching — it diagnoses what you know, creates a lesson plan, teaches one concept at a time, quizzes you, and tracks your mastery across topics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/teacher-gpt run dev` — run the React frontend (port 21374)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, run after schema changes)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provided by Replit DB)
- Required env: `SESSION_SECRET` — used as JWT signing key (set in Replit Secrets)
- Optional env: `OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY` — enables the AI teacher

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (HS256 via Node.js built-in `crypto`), password hashing via `scrypt`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/api-server/src/lib/auth.ts` — JWT sign/verify + scrypt password hashing
- `artifacts/api-server/src/middlewares/auth.ts` — `requireAuth` middleware
- `artifacts/teacher-gpt/src/pages/` — frontend pages (login, register, dashboard, topics, progress, chat)
- `artifacts/teacher-gpt/src/hooks/use-auth.tsx` — auth context: token stored in localStorage, injected into API calls
- `lib/db/src/schema/` — Drizzle table definitions (users, conversations, messages, topic_progress, quiz_results)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)

## Architecture decisions

- **Node.js-only auth**: JWT and scrypt use Node.js built-in `crypto` — no extra packages needed.
- **User-scoped conversations**: All conversation queries filter by `userId` from the JWT payload, preventing IDOR.
- **JWT via localStorage**: The `setAuthTokenGetter` hook in the API client automatically attaches `Authorization: Bearer <token>` to all requests. The SSE streaming endpoint receives the token via an explicit `Authorization` header.
- **SESSION_SECRET required**: The server throws at startup if `SESSION_SECRET` is not set — no insecure fallback.
- **Single-user data model (progress/quizzes)**: Topic progress and quiz results are not yet user-scoped. All users share the same progress rows. See follow-up tasks.

## Product

- **Register/Login**: users create accounts and sign in with email + password
- **Dashboard**: shows mastery stats and recent conversations
- **Topics**: curriculum browser for Python Full Stack; click any topic to start a Socratic session
- **Chat**: streams AI responses, renders Markdown + syntax-highlighted code
- **Progress**: radar chart + bar chart of topic mastery and quiz scores

## First-run setup

After setting up the Replit database and secrets:
1. Run `pnpm --filter @workspace/db run push` to create all tables (users, conversations, etc.)
2. Start the API Server workflow
3. Start the TeacherGPT frontend workflow

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The Vite dev server for the frontend is on port 21374 (set by artifact.toml). Don't hardcode 3000.
- `pnpm --filter @workspace/db run push` must be re-run whenever the Drizzle schema changes.
- The `conversations` table has a nullable `user_id` column added after initial import — existing rows have `NULL` userId. New conversations are always created with the authenticated user's id.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
