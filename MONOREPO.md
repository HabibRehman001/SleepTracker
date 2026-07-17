# Monorepo relationship (Step 117) — LOCKED

## Decision

**Same git root, separate apps** — not a yarn/npm workspace, not a shared
React package tree.

| Path | Owns | Does not own |
|------|------|----------------|
| `web-app/` | Phase 1 Vite UI | Lock / kiosk / call-block |
| `Backend/` | Phase 1 analytics API + sleep DB | Mobile lock sessions |
| `mobile-app/` | Phase 2 Expo enforcement UI + `SleepLockModule` | Sleep analytics KPIs |
| `mobile-server/` | Phase 2 Express + MongoDB (:4001) | Phase 1 sleep-entry models |

## Why separate backends

- Phase 1 models **nights, factors, experiments** (analysis) — SQLite.
- Phase 2 models **lock sessions, schedules, device policy** (enforcement) — MongoDB.
- Coupling them early would force bad migrations and fight the OS split (Step 114).

`mobile-server/` (Step 125) is the Phase 2 API — **not** Prisma from `Backend/`.

## Independence test

```bash
cd web-app && npm install && npm run dev
cd mobile-app && npm install && npx expo start --dev-client
cd mobile-server && npm install && npm run dev   # needs mongod / Docker on :27017
```

Each folder has its own `package.json` / `node_modules`. No root workspace
hoisting.
