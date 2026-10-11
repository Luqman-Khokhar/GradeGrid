# GradeGrid

Turn student result card PDFs into a single CSV. Upload many PDFs, choose the columns you want, download one CSV with one row per student. Responsive and installable as a PWA.

## Stack

| Layer | Tech |
|-------|------|
| Client | React 19, Vite, Redux Toolkit, Tailwind CSS v4, vite-plugin-pwa |
| Server | Node 22, Express 5, Mongoose (MongoDB), Multer, pdfjs-dist |
| Hosting | Vercel (two projects: `client/` and `server/`), MongoDB Atlas |

## Structure

```
GradeGrid/
├── client/                  # React PWA
│   ├── public/              # icons, favicon
│   └── src/
│       ├── app/store.js     # Redux store
│       ├── components/      # shared UI
│       ├── features/        # Redux slices per feature
│       ├── pages/
│       └── services/api.js  # fetch wrapper
└── server/                  # Express API
    ├── api/index.js         # Vercel serverless entry
    └── src/
        ├── app.js           # Express app (no listen)
        ├── server.js        # local dev entry
        ├── config/          # env + db connection
        ├── controllers/
        ├── middleware/
        ├── models/
        ├── routes/
        └── services/        # PDF extraction, CSV building
```

## Setup

```bash
nvm use            # Node 22
npm install        # installs all workspaces
```

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/gradegrid
CLIENT_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_MB=4
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Run both apps:

```bash
npm run dev
```

Client: http://localhost:5173 · API: http://localhost:5000/api/health

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | client + server together |
| `npm run dev:client` / `dev:server` | one side only |
| `npm run build` | production build of the client |
| `npm run lint` | ESLint across the repo |
| `npm test` | unit tests (Node test runner) in both workspaces |

## API

| Method | Path | Body | Result |
|--------|------|------|--------|
| GET | `/api/health` | — | status + DB state |
| POST | `/api/results/extract` | multipart `files[]` (PDF) | labelled fields per file: `[{ key, label, value }]` |

## How extraction works

1. `services/pdfExtractor.js` reads text items with their positions using pdf.js.
2. `services/textLayout.js` groups items into lines and puts a tab wherever there's a wide horizontal gap.
3. `services/fieldExtractor.js` detects `Label: value` pairs and subject tables (a header row starting with "Subject"), and flattens table rows into fields like `Mathematics Obtained`.

The client merges fields from all cards into columns, the user picks the ones they want, and the CSV is built in the browser.

Scanned (image-only) PDFs contain no text and are reported as "No details found"; OCR is not supported yet.

## Deploy (Vercel)

Create **two** Vercel projects from this repo:

1. **gradegrid-api** with Root Directory `server`. Env vars: `MONGODB_URI` (Atlas), `CLIENT_ORIGINS` (the client URL), `NODE_ENV=production`.
2. **gradegrid** with Root Directory `client` and Framework preset Vite. Env var: `VITE_API_URL` (the API URL).

Vercel limits each serverless request body to 4.5 MB, so the client must send PDFs in batches that stay under that size.

## Git

See `.claude/skills/git/SKILL.md`. Work on `feature/*` or `fix/*` branches and merge to `main` through PRs.
