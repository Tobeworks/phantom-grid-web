# phantom-grid-web

Astro SSR frontend for [phantom-grid.de](https://phantom-grid.de).
Built with Astro 6, Tailwind CSS v4, Node standalone adapter.
Deployed via GitHub Actions → GHCR → ArgoCD on Kubernetes.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Astro 6 (SSR, Node standalone) |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| Backend | PocketBase (separate container) |
| Deploy | Docker → `ghcr.io` → ArgoCD |
| Data | `phantom-grid-os` (git submodule) |

---

## Local Setup

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/Tobeworks/phantom-grid-web.git
cd phantom-grid-web

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Requires Node 22+. Uses `pnpm` — never npm or yarn.

### Environment Variables

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `POCKETBASE_URL` | `http://localhost:8090` | PocketBase API endpoint (runtime, not build-time) |

---

## Git Submodules

`phantom-grid-os` is embedded as a git submodule. This is the central data/config repository shared across all Phantom Grid tools — the web frontend, the social media animator, and any future satellite repos all read from it.

### Architecture

```
phantom-grid-os/          ← central OS repo (submodule)
├── data/releases.json    ← release catalog, tracks, CDN URLs
├── tools/pocketbase/     ← PocketBase migrations
└── docs/                 ← documentation

phantom-grid-web/         ← this repo
└── phantom-grid-os/      ← submodule pointer (pinned commit)

phantom-grid-social/      ← future: social media animator
└── phantom-grid-os/      ← same submodule

phantom-grid-xyz/         ← future: any new satellite tool
└── phantom-grid-os/      ← same submodule
```

The submodule is a **pointer to a specific commit** in `phantom-grid-os` — not a live reference. This ensures stability: a satellite repo only gets new OS data when explicitly updated.

### Daily Workflow

**After cloning (first time):**
```bash
git clone --recurse-submodules https://github.com/Tobeworks/phantom-grid-web.git
```

**If you forgot `--recurse-submodules`:**
```bash
git submodule update --init --recursive
```

**Pull latest changes including submodule updates:**
```bash
git pull
git submodule update --remote --merge
```

**After phantom-grid-os gets new releases/data:**
```bash
cd phantom-grid-os
git pull origin main
cd ..
git add phantom-grid-os
git commit -m "chore: update phantom-grid-os submodule"
git push
```

### Adding the Submodule to a New Satellite Repo

Every new tool that needs access to releases, assets or migrations follows the same pattern:

```bash
# Inside the new repo
git submodule add https://github.com/Tobeworks/phantom-grid-os.git phantom-grid-os
git commit -m "feat: add phantom-grid-os as submodule"
git push
```

Then in your code, reference data directly:

```ts
// Astro / TypeScript
import releasesData from '../phantom-grid-os/data/releases.json';

// Node.js
const releases = JSON.parse(fs.readFileSync('./phantom-grid-os/data/releases.json', 'utf8'));
```

**In GitHub Actions**, always add `submodules: recursive` to the checkout step:

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
```

Without this, the submodule folder will be empty in the CI build and the Docker image will fail.

---

## Promo Tool

Token-gated listening pages for DJs. No account, no login — just a link with a token.

Full backend documentation: [`phantom-grid-os/docs/promo-tool.md`](phantom-grid-os/docs/promo-tool.md)

**URL format:**
```
https://phantom-grid.de/promo/[release-slug]?t=[TOKEN]
```

**API endpoints:**

| Endpoint | Description |
|---|---|
| `GET /api/promo/download?t=TOKEN&q=128\|320` | ZIP of all tracks |
| `GET /api/promo/download?t=TOKEN&q=128\|320&track=N` | Single track download |
| `POST /api/promo/feedback` | Submit feedback |

### Local PocketBase for development

```bash
# Download binary (macOS arm64 example)
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.36.8/pocketbase_0.36.8_darwin_arm64.zip -o /tmp/pb.zip
unzip /tmp/pb.zip pocketbase -d phantom-grid-os/tools/pocketbase/

# Run with migrations
cd phantom-grid-os/tools/pocketbase
./pocketbase serve \
  --http=0.0.0.0:8090 \
  --dir=./pb_data \
  --migrationsDir=./pb_migrations
```

Admin UI: `http://localhost:8090/_/` — create a superuser account on first run.

Test a promo link locally:
```
http://localhost:4321/promo/pg-001?t=TEST123
```

(Requires a matching record in the `promos` collection.)

**Production admin:**
```
https://pb.phantom-grid.de/_/
```

---

## Deployment

Push to `main` → GitHub Actions builds Docker image → pushes to `ghcr.io/tobeworks/phantom-grid-web:latest` → ArgoCD Image Updater detects new digest → deploys automatically.

---

## Project Structure

```
src/
├── components/           Astro components (AudioPlayer, ReleaseCard, …)
├── layouts/              BaseLayout
├── lib/
│   ├── pocketbase.ts     PocketBase API helpers
│   └── errorPages.ts     Styled HTML error generator
├── pages/
│   ├── index.astro       Homepage (static)
│   ├── releases/         Release detail pages (static)
│   ├── promo/
│   │   └── [slug].astro  Token-gated promo page (SSR)
│   └── api/promo/
│       ├── download.ts   Download endpoint — single track + ZIP (SSR)
│       └── feedback.ts   Feedback POST endpoint (SSR)
└── styles/
    └── global.css        Tailwind v4 @theme + component layer
```
