# SleepTracker

Monorepo root — Phase 1 analysis web + Phase 2 lock mobile live **side by side**,
not as one shared app. Separate installs, separate purposes, separate backends.

| Folder | Phase | Purpose | Run |
|--------|-------|---------|-----|
| `web-app/` | 1 | Sleep logging + analytics | `cd web-app && npm install && npm run dev` |
| `Backend/` | 1 | Analysis API (Prisma/SQLite) | `cd Backend && npm install && npm run dev` |
| `mobile-app/` | 2 | Enforcement / Sleep Lock | `cd mobile-app && npm install && npx expo start --dev-client` |

**Decision (Step 117):** same git root for convenience; **not** a shared package
workspace. Mobile gets its own backend later — do not couple lock sessions to
Phase 1 sleep-entry models.

## Phase 1 (analysis)

```bash
cd Backend && npm install && npm run dev
cd web-app && npm install && npm run dev
```

## Phase 2 (enforcement)

```bash
cd mobile-app && npm install
npx expo run:android   # or run:ios on macOS — custom dev client, not Expo Go
```
