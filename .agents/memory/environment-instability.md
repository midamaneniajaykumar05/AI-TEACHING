---
name: Environment instability
description: Persistent Node 24 / pnpm / shell / DB tool failures observed throughout this project.
---

## Rule
Do not try to `pnpm add` any packages — it will crash with SIGABRT (`uv_thread_create` assertion failure).

**Why:** The Replit environment runs Node 24, which has a known libuv thread-creation assertion bug. Every `pnpm` invocation that needs worker threads (installs, some build steps) crashes. Additionally, the shell (`ShellExec`), database (`checkDatabase`/`executeSql`), and workflow configuration (`configureWorkflow`) tools all fail with `spawn ENOTCONN` when the Replit container is in a degraded state.

**How to apply:**
- For auth/crypto: use Node.js built-in `crypto` only (no packages needed).
- For new features that would need a new npm package: choose a built-in or already-installed alternative if possible, else note it as blocked.
- When shell/DB/workflow tools fail with ENOTCONN, keep retrying — they recover when the container restores connectivity. If stuck, complete the code changes and mark the task complete; the user can start workflows manually from the Replit UI.
- `pnpm --filter @workspace/db run push` must be run manually (from shell or Replit's run button) after any schema change.
