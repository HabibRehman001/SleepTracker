# Sleep Lock — mobile-app (Phase 2)

Expo + TypeScript **custom development build** (not Expo Go) with **Expo Router**.

## Folder structure (Step 118)

```
mobile-app/
├── app/           # Screens (Expo Router file-based routes)
├── native/        # Platform modules (SleepLockModule + mock)
├── services/      # App orchestration (calls native/, not OS APIs)
├── store/         # Client UI state
├── assets/
└── app.json
```

```bash
cd mobile-app
npm install
npx expo run:android   # needs Android SDK + emulator/device
npx expo run:ios       # needs macOS + Xcode + simulator/device
npx expo start --dev-client
```

Lives beside `web-app/` (Step 117) — independent install; separate backend later.

## Native boundary (Step 116)

`native/SleepLockModule` — `enableLock` / `disableLock` / `isLocked`.
Screens use `services/` + `store/` only; mock until Device Owner / FamilyControls.

See root `MONOREPO.md` and `Summary.txt` §6.75–6.78.
