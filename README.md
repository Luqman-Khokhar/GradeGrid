# GradeGrid

Turn student result card PDFs into a single CSV. Upload many PDFs, choose the columns you want, download one CSV with one row per student. Responsive and installable as a PWA.

## Stack

| Layer | Tech |
|-------|------|
| Client | React 19, Vite, Redux Toolkit, Tailwind CSS v4, vite-plugin-pwa |
| Server | Node 22, Express 5, Mongoose (MongoDB), Multer, pdfjs-dist, tesseract.js, @napi-rs/canvas |
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

**Text PDFs** (have a text layer):

1. `services/pdfExtractor.js` reads text items with their positions using pdf.js.
2. `services/textLayout.js` groups items into lines and puts a tab wherever there's a wide horizontal gap.
3. `services/fieldExtractor.js` detects `Label: value` pairs and subject tables (a header row starting with "Subject"), and flattens table rows into fields like `Mathematics Obtained`.

**Scanned / image PDFs** (no text layer, e.g. BISE online result cards) go through OCR (`services/ocr/`):

1. `renderPage.js` renders page 1 at ~1800 px wide in greyscale and stretches the contrast so the watermark disappears.
2. `engine.js` runs Tesseract (tesseract.js) with two engines: LSTM for words and layout, and the legacy engine for single marks cells, because LSTM drops this font's "1".
3. `biseCard.js` recognises the BISE marks sheet, finds the subject rows, and re-reads every cell at known column positions.
4. `reconcile.js` checks each subject's arithmetic (total = 11th + 12th + practical) and the grand total, auto-corrects single misreads, and returns warnings. The UI shows these warnings next to the file.

Other scanned layouts fall back to the generic `Label: value` parser over the OCR text. OCR takes about 10 s per card; the first request on a fresh server also downloads about 23 MB of language data into the OS temp dir.

The client merges fields from all cards into columns, the user picks the ones they want (with one-click groups such as "Total" or "Grade" across every subject), and the CSV is built in the browser.

## Deploy (Vercel)

Create **two** Vercel projects from this repo:

1. **gradegrid-api** with Root Directory `server`. Env vars: `MONGODB_URI` (Atlas), `CLIENT_ORIGINS` (the client URL), `NODE_ENV=production`.
2. **gradegrid** with Root Directory `client` and Framework preset Vite. Env var: `VITE_API_URL` (the API URL).

Vercel limits each serverless request body to 4.5 MB, so the client must send PDFs in batches that stay under that size.

## Git

See `.claude/skills/git/SKILL.md`. Work on `feature/*` or `fix/*` branches and merge to `main` through PRs.
