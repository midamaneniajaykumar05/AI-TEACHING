---
name: Workflow setup needed
description: The two artifact services need workflows configured; artifacts aren't registered in the Replit system.
---

## Rule
The TeacherGPT app has two services that need workflows but are not registered as Replit artifacts.

**Why:** The project was imported from GitHub. `listArtifacts()` returns `[]`. The artifact directories (`artifacts/teacher-gpt`, `artifacts/api-server`) exist on disk but Replit's artifact registry doesn't know about them.

**How to apply:**
- Use `configureWorkflow()` (not artifact skill) to register:
  - API Server: `pnpm --filter @workspace/api-server run dev`, port 8080, outputType "console"
  - TeacherGPT: `pnpm --filter @workspace/teacher-gpt run dev`, port 21374, outputType "webview"
- Run these when the environment recovers (no ENOTCONN).
- After workflows exist, use `WorkflowsRestart` to cycle them.
- The frontend artifact.toml sets BASE_URL and PORT in its env block — the dev server picks these up automatically.
