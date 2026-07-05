---
name: Auth architecture
description: How JWT auth is implemented — Node.js built-ins only, no external packages, key constraints.
---

## Rule
Use only Node.js built-in `crypto` for auth — `scrypt` for password hashing, `createHmac` for HS256 JWT signing.

**Why:** pnpm crashes with a `uv_thread_create` assertion failure in this environment (Node 24 / libuv bug). No new npm packages can be installed. `bcryptjs` and `jsonwebtoken` are off the table.

**How to apply:**
- `artifacts/api-server/src/lib/auth.ts` is the single source for `hashPassword`, `verifyPassword`, `signJwt`, `verifyJwt`.
- `SESSION_SECRET` env var is required — the server throws at startup if missing (no insecure fallback).
- JWT payload shape: `{ sub: userId (number), iat, exp }`.
- Tokens stored in localStorage on the client; injected via `setAuthTokenGetter` from `@workspace/api-client-react`.
- SSE streaming endpoint receives the token via an explicit `Authorization: Bearer <token>` header.

## Data scoping
All conversation queries filter by `req.user.sub` (userId) to prevent IDOR. Conversations table has a nullable `user_id` column (nullable to preserve existing rows).
Topic progress and quiz results are NOT yet user-scoped — follow-up task exists for that.
