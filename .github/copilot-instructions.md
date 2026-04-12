# Copilot / AI Assistant SDLC Guide (Reusable Template)

Purpose
- Provide a concise, reusable guide for Copilot/AI assistants across projects.
- Include environment setup, security guardrails, coding standards, CI/testing, release, and run commands.

How to reuse
- Copy this file into `.github/copilot-instructions.md` of any target repo and edit the `Project metadata` and `External services` sections.

---

## 1) Project metadata (REPLACE)
- Project name: <project-name>
- Primary stack: e.g., Next.js (Node.js 20+), Python 3.11, Postgres, Firestore, Redis
- Preferred package manager: npm | yarn | pnpm
- Entrypoints: `start.sh`, `Makefile` targets: `install`, `dev`, `build`, `test`, `clean`

## 2) Environment & local setup
- Python: always use a venv in project root (`python -m venv .venv`) and activate before running
- Node: respect lockfile (package-lock.json, yarn.lock, pnpm-lock.yaml)
- Provide `.env.example` with placeholders only — never include real secrets

Minimal commands (adjust per project):
```bash
# Node
npm ci
npm run dev

# Python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./start.sh
```

Example `.env.example` (no secrets):
```
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgres://user:pass@localhost:5432/db
FIREBASE_PROJECT_ID=your-project-id
STRIPE_SECRET_KEY=sk_test_XXXXX
GITHUB_APP_WEBHOOK_SECRET=replace-me
RESEND_API_KEY=replace-me
```

---

## 3) Startup / One-Click rule
- Provide `start.sh` that activates the venv (if Python) and launches dev servers with background handling and `trap '...' INT` to shutdown cleanly.
- Ensure `Makefile` contains `install`, `dev`, `build`, `test`, `clean`.

---

## 4) Language & framework standards
- JavaScript/TypeScript
  - Prefer ESM imports (`import` / `export`), avoid `any`, add `test` script in `package.json`.
  - Linting via ESLint, formatting via Prettier or integrated tooling.
- Python
  - Use type hints, follow PEP8 (Ruff/Black formatting), prefer `async def` for web handlers.
- React / Next.js
  - Functional components + hooks only. Prefer React Context for global state over Redux unless already in use.
  - Tailwind for styling where appropriate.

---

## 5) Services, storage & DB patterns
- Firestore: use modular SDK (`getFirestore`) and `count()` aggregation for totals.
- Postgres: use parameterized queries / ORM (Prisma/SQLAlchemy) and migrations.
- S3/MinIO: use presigned URLs for client uploads; never proxy large files through the app server.

---

## 6) Security guardrails
- NEVER hardcode secrets; always use environment variables and add `.env.example`.
- Input validation: use Zod (TS) or Pydantic (Python) for all API payloads.
- Rate limiting: centralize and ensure `X-Forwarded-For` is trusted only when behind a known reverse proxy.
- Timing-safe comparisons for secrets (use `crypto.timingSafeEqual` or equivalent).
- Escape or sanitize any user content rendered into HTML.
- Avoid returning stack traces to clients; log full traces internally (Sentry/PostHog).

---

## 7) Authentication & Authorization
- Every protected API must explicitly verify authentication and authorization.
- Use secure cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict` where appropriate.
- For multi-org systems, validate `X-Org-Id` header format before using it as a doc ID.

---

## 8) Rate limiting & Abuse
- Implement per-IP limits and per-entity caps (e.g., per-org hourly credit cap).
- For hosted deployments, prefer Redis-backed rate limiters and fall back to in-memory.
- Expose retry hints (`Retry-After`) in 429 responses; surface them in client UIs.

---

## 9) Error handling & logging
- Return safe, user-friendly errors: 400/401/403/404/429/500; avoid exposing internals.
- Log stack traces and sensitive context to a secure telemetry sink (Sentry, LogDNA, etc.).

---

## 10) CI / CD
- Minimal GitHub Actions workflow: `lint → test → build → deploy`.
- CI should use `npm ci` or `pip install -r requirements.txt` and rely on lockfiles.

Example `.github/workflows/ci.yml` (minimal):
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
```

---

## 11) Testing
- Add unit tests for core business logic (billing, credits, auth checks). Use `vitest`/`jest` for JS, `pytest` for Python.
- Add small integration tests for critical endpoints.
- Require tests + lint in CI; expose a `test` script in `package.json`.

---

## 12) API docs
- Auto-generate OpenAPI/Swagger for HTTP APIs and keep it in the repo (e.g., `openapi.yaml`).

---

## 13) Release & changelog
- Follow Keep a Changelog. Add release notes to `docs/changelog.html` or `CHANGELOG.md`.

---

## 14) PR / Code review checklist
- Small, focused PRs; link to related issue; include tests; run `npm run lint` and `npm test` locally.
- Ensure no secrets in the diff; include migration and rollback steps for DB changes.

---

## 15) Developer pre-merge checklist
- `npm run lint` passes
- `npm test` passes
- No secrets in diffs
- `README.md` updated if behavior changed
- DB migrations included if schema changes

---

## 16) Appendix & maintenance notes
- Keep this file updated when the stack changes (new providers, auth changes, or hosting).
- Remove hard-coded project examples before sharing publicly.

---

If you want, I can now:
- Copy this into `.github/copilot-instructions.md` (overwrite) and adapt the project-specific sections for this repo, or
- Generate a shorter checklist variant for contributors.
