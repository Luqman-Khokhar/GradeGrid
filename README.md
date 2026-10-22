# GradeGrid

Turn student result cards (PDFs or screenshots) into one spreadsheet. Upload many files, choose the columns you want, and download one Excel or CSV file with one row per student. Responsive and installable as a PWA.

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
# Optional in development (rate limiting is off without it). Required in production:
# extraction is refused while the rate limit cannot be checked.
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/gradegrid?retryWrites=true&w=majority
CLIENT_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_MB=4
# Files one client (IPv4 address or IPv6 /64) may process per hour (needs MongoDB)
RATE_LIMIT_FILES_PER_HOUR=200
# Files all clients together may process per hour: a ceiling on compute cost
RATE_LIMIT_GLOBAL_FILES_PER_HOUR=2000
# Proxy hops in front of the server. 1 is right for Vercel; on other hosts set it to the
# real chain, or clients can fake their IP with X-Forwarded-For and dodge the rate limit.
TRUST_PROXY=1
# Optional Cloudflare Turnstile secret; set together with VITE_TURNSTILE_SITE_KEY on the client
TURNSTILE_SECRET_KEY=
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
# Optional Cloudflare Turnstile site key (bot check on every upload)
VITE_TURNSTILE_SITE_KEY=
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
| GET | `/api/health` | — | status + DB state (`connected` / `unreachable` / `not configured`) |
| POST | `/api/results/extract` | multipart `files[]` (PDF, PNG, JPG, WebP), up to 5 | per file: `{ fields: [{ key, label, value }], warnings, source, card? }`; `card` (student, subjects, totals, result) only for recognised BISE marks sheets; rate limited per client and globally |

Saved column selections live in each browser (`localStorage`), not on the server.

## Security

The app has no accounts, so the API is public. These controls keep it from being abused:

| Threat | Control |
|--------|---------|
| Scripts calling the API directly | Cloudflare Turnstile token required on every upload (when `TURNSTILE_SECRET_KEY` is set); production POSTs without an `Origin` header are refused |
| Flooding / compute cost | Per-client hourly file limit (IPv6 grouped by /64) plus a global hourly cap; checked before the upload is parsed; fails closed in production |
| Decompression bombs and odd page sizes | Image dimensions read from the file header before decoding; images and rendered pages capped at 25 MP and 12 000 px a side; PDFs capped at 10 pages; pdf.js skips oversized embedded images |
| Disguised files | Type detected from the file's bytes, not the client's `Content-Type` |
| Large or malformed bodies | Multer limits on files, fields and parts; JSON bodies capped at 10 KB; Vercel caps bodies at 4.5 MB |
| Information leaks | Parser errors replaced by a generic message (details go to the server log); DB setup hints hidden from `/api/health` in production |
| Client-side attacks | CSP, `X-Frame-Options`, `nosniff`, HSTS and Referrer-Policy headers in `client/vercel.json`; CSV/XLSX formula injection neutralised |

If you edit the inline theme script in `client/index.html`, update its `sha256` in the CSP in `client/vercel.json`, or the browser will block it.

## Data stored in MongoDB

| Collection | What | Notes |
|------------|------|-------|
| `ratelimits` | per-IP counters for each hour | TTL index removes them when the window ends |

Student data is never stored: PDFs and extracted results live only in the request and in the browser.

## How extraction works

**Text PDFs** (have a text layer):

1. `services/pdfExtractor.js` reads text items with their positions using pdf.js.
2. `services/textLayout.js` groups items into lines and puts a tab wherever there's a wide horizontal gap.
3. `services/fieldExtractor.js` detects `Label: value` pairs and subject tables (a header row starting with "Subject"), and flattens table rows into fields like `Mathematics Obtained`.

**Scanned / image PDFs** (no text layer, e.g. BISE online result cards) go through OCR (`services/ocr/`):

1. `renderPage.js` renders page 1 at ~1800 px wide in greyscale and stretches the contrast so the watermark disappears.
2. `engine.js` runs Tesseract (tesseract.js) with two engines: LSTM for words and layout, and the legacy engine for single marks cells, because LSTM drops this font's "1".
3. `biseCard.js` recognises the BISE marks sheet. Part-II cards (11th / 12th / Practical columns) are parsed there: it finds the subject rows and re-reads every cell at known column positions. Part-I cards (one Obtained column, e.g. HSSC (P-I)) go to `bisePart1.js`, which places columns from the heading words and re-reads cells only when the page reading does not add up to the card's totals.
4. `reconcile.js` checks each subject's arithmetic (Part I: marks within max and summing to the total) (total = 11th + 12th + practical) and the grand total, auto-corrects single misreads, and returns warnings. The UI shows these warnings next to the file.

**Screenshots** (PNG/JPG/WebP) take the same OCR path: `prepareImage` trims plain margins (page background, empty bars) and scales the content to OCR size. `biseCard.js` then locates the card from where the "Roll No." and "Registration No." labels appear (`findFrame`), so phone screenshots with a browser bar, desktop screenshots with margins and tight crops all map onto the same column positions. Camera photos of printed cards (angled, shadowed) are not supported.

Other scanned layouts fall back to the generic `Label: value` parser over the OCR text. OCR takes about 10 s per card; the first request on a fresh server also downloads about 23 MB of language data into the OS temp dir.

For recognised BISE cards the main download is the **class sheet** (`client/src/utils/classSheetPlan.js`), the school's own marks-sheet layout: one worksheet per group, sorted by roll no, columns Roll No, Student Name, Father Name, one column per subject with its max in the header, then Total Max Marks, Total Obtained and Overall Status. Subjects that take the same place on the card share a column (`Phy / Eco (85/100)`), so a mixed class stays narrow; subject names are mapped to fixed headers and codes in `client/src/utils/subjects.js`, tolerating OCR misreads. A subject under 33% or absent is red, the student is COMPARTMENT, and Total Obtained lists the subject codes.

Behind **Custom columns**, the client merges fields from all cards into columns, the user picks the ones they want (with one-click groups such as "Total" or "Grade" across every subject), and the file is built in the browser:

- **Excel (.xlsx)**, the main download, built with `exceljs` (loaded only when exporting): the data is an Excel table, so every header has filter, sort and search; numbers are stored as numbers; the header row and identity columns are frozen; failing or absent results and marks under 33% are red, and marks under 50% or low grades are amber. The rules live in `client/src/utils/xlsxPlan.js`.
- **CSV**, for other systems. Formula-like values are neutralised against CSV injection.

## Deploy (Vercel)

Create **two** Vercel projects from this repo:

1. **gradegrid-api** with Root Directory `server`. Env vars: `MONGODB_URI` (Atlas; Network Access must allow `0.0.0.0/0`), `CLIENT_ORIGINS` (the client URL), `NODE_ENV=production`, and `TURNSTILE_SECRET_KEY` if you use Turnstile.
2. **gradegrid** with Root Directory `client` and Framework preset Vite. Env vars: `VITE_API_URL` (the API URL) and `VITE_TURNSTILE_SITE_KEY` if you use Turnstile.

Turnstile: in the Cloudflare dashboard add a widget (mode **Managed** or **Invisible**) for the client's domain, then set the site key on the client and the secret key on the server. Set both or neither.

Because Atlas must accept connections from any IP (Vercel has no fixed outbound IPs), the password is the only thing protecting the database. Use a long random password, and a database user whose only role is `readWrite` on the `gradegrid` database. Set a spend limit in Vercel as a last line of defence against compute abuse.

Vercel limits each serverless request body to 4.5 MB, so the client must send PDFs in batches that stay under that size.

## Git

See `.claude/skills/git/SKILL.md`. Work on `feature/*` or `fix/*` branches and merge to `main` through PRs.
