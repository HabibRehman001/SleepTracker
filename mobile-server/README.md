# mobile-server (Phase 2)

Express + TypeScript + **MongoDB** — separate from Phase 1 `Backend/` (Prisma/SQLite).

| | Phase 1 `Backend/` | Phase 2 `mobile-server/` |
|--|--------------------|---------------------------|
| Port | 4000 | **4001** |
| DB | SQLite | MongoDB |
| Purpose | Sleep analytics | Lock sessions / schedules / device policy |

## Run

```bash
# Mongo (Docker if mongod not installed)
docker run -d --name sleep-lock-mongo -p 27017:27017 mongo:7

cd mobile-server
cp .env.example .env
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:4001/api/health
```

## LAN-only access (Step 131)

No auth — same “single user, no cloud” spirit as Phase 1. Security is **network locality**:

| Setting | Purpose |
|--|--|
| `HOST=0.0.0.0` | Listen on all interfaces so a phone on home Wi-Fi can connect |
| `HOST=127.0.0.1` | This machine only (phone cannot reach) |
| `ALLOW_PUBLIC=false` | Reject non-private client IPs with **403** (defense if you accidentally port-forward) |

Typical home deploy: run on a Raspberry Pi / always-on laptop on your Wi-Fi. Point the phone at the printed `LAN:` URL (e.g. `http://192.168.x.x:4001`).

**Phone test**
1. Same Wi-Fi → `curl` / browser / app to `http://<LAN-IP>:4001/api/health` → **200**
2. Cellular (leave Wi-Fi) → same URL → **fails** (private IP not routable; no port-forward)

Do **not** open the port on your router or set `ALLOW_PUBLIC=true` unless you knowingly add real auth later.

```bash
# After npm run dev, use a LAN line from the startup log:
curl http://192.168.x.x:4001/api/health
```

Sessions (Step 127):

```bash
curl -X POST http://localhost:4001/sessions \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-07-17T00:00:00.000Z","bedTime":"2026-07-16T23:00:00.000Z","wakeTime":"2026-07-17T07:00:00.000Z","source":"baseline-auto","stepsCount":4200}'

curl 'http://localhost:4001/sessions?range=30d'
```

Schedule (Step 128):

```bash
curl -X POST http://localhost:4001/schedule \
  -H 'Content-Type: application/json' \
  -d '{"sleepTime":"04:00","wakeTime":"12:00"}'

# second POST → 409
curl -X POST http://localhost:4001/schedule \
  -H 'Content-Type: application/json' \
  -d '{"sleepTime":"05:00","wakeTime":"13:00"}'

curl http://localhost:4001/schedule
```

Monthly stats (Step 129):

```bash
curl 'http://localhost:4001/stats/monthly?limit=12'
```

Month comparison (Step 130):

```bash
curl 'http://localhost:4001/stats/comparison'
# optional: curl 'http://localhost:4001/stats/comparison?month=2026-07'
```

Home location (Step 137) — persists in Mongo (survives app reinstall):

```bash
curl -X PUT http://localhost:4001/home-location \
  -H 'Content-Type: application/json' \
  -d '{"latitude":31.5204,"longitude":74.3587}'

curl http://localhost:4001/home-location
```
