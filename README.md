# phantom-grid-web

Astro SSR frontend for [phantom-grid.de](https://phantom-grid.de).
Built with Astro 6, Tailwind CSS v4, Node standalone adapter.
Deployed via GitHub Actions → GHCR → ArgoCD on Kubernetes (netcup).

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Astro 6 (SSR, Node standalone) |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Backend | PocketBase (separate container) |
| Deploy | Docker → ghcr.io → ArgoCD |
| Data | `phantom-grid-os/data/releases.json` (git submodule) |

---

## Local Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Requires Node 22+. Uses `pnpm` — never npm or yarn.

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `POCKETBASE_URL` | `http://localhost:8090` | PocketBase API endpoint |

---

## Local PocketBase (for Promo Tool development)

The promo tool requires a running PocketBase instance. For local development:

### 1. Download PocketBase

```bash
# macOS arm64
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.36.8/pocketbase_0.36.8_darwin_arm64.zip -o /tmp/pb.zip
unzip /tmp/pb.zip -d phantom-grid-os/tools/pocketbase/
```

### 2. Run PocketBase with migrations

```bash
cd phantom-grid-os/tools/pocketbase
./pocketbase serve \
  --http=0.0.0.0:8090 \
  --dir=./pb_data \
  --migrationsDir=./pb_migrations
```

PocketBase läuft dann auf `http://localhost:8090`.
Admin UI: `http://localhost:8090/_/`
Beim ersten Start: Superuser-Account anlegen (Email + Passwort).

### 3. Promo-Link lokal testen

```
http://localhost:4321/promo/pg-001?t=TEST123
```

Dafür muss ein Promo-Record in der Admin UI angelegt sein:
→ `http://localhost:8090/_/` → Collections → promos → New record

---

## Promo Tool

Token-geschützte Seiten für DJs. Vollständige Dokumentation:
→ [`phantom-grid-os/docs/promo-tool.md`](../phantom-grid-os/docs/promo-tool.md)

**URL-Format:**
```
https://phantom-grid.de/promo/[release-slug]?t=[TOKEN]
```

**API Endpoints:**
| Endpoint | Beschreibung |
|---|---|
| `GET /api/promo/download?t=TOKEN&q=128\|320` | ZIP aller Tracks |
| `GET /api/promo/download?t=TOKEN&q=128\|320&track=N` | Einzeltrack |
| `POST /api/promo/feedback` | Feedback speichern |

---

## Deployment

Push auf `main` → GitHub Actions baut Docker Image → pusht nach `ghcr.io/tobeworks/phantom-grid-web:latest` → ArgoCD Image Updater deployed automatisch.

### Production PocketBase Admin

```
https://pb.phantom-grid.de/_/
```

---

## Project Structure

```
src/
├── components/        — Astro components (AudioPlayer, ReleaseCard, …)
├── layouts/           — BaseLayout
├── lib/
│   ├── pocketbase.ts  — PocketBase API helpers
│   └── errorPages.ts  — Styled error HTML generator
├── pages/
│   ├── index.astro    — Homepage (static)
│   ├── releases/      — Release pages (static)
│   ├── promo/
│   │   └── [slug].astro  — Token-gated promo page (SSR)
│   └── api/promo/
│       ├── download.ts   — Download endpoint (SSR)
│       └── feedback.ts   — Feedback endpoint (SSR)
└── styles/
    └── global.css     — Tailwind v4 @theme + component layer
```
