# Slotly - AI Booking Assistant

Slotly is a production-ready, monorepo-based booking platform featuring a Gemini-powered AI booking assistant.

## Architecture

- **Frontend (`/client`)**: React 19 + Vite 7 + Tailwind CSS v4 + TanStack Query.
- **Backend (`/server`)**: Node.js + Express + Mongoose + Zod + `@google/genai`.
- **Database**: MongoDB (use Atlas for production).

## Try it in one command

No MongoDB install, no Atlas account, no credentials:

```bash
npm install
npm run dev:demo --workspace=server   # API on :5000, in-memory DB, pre-seeded
npm run dev --workspace=client        # UI on :5173
```

`dev:demo` boots a throwaway in-memory MongoDB, seeds a fortnight of realistic
appointments across three staff members, and starts the API. Sign in at `/login` with
`admin@slotly.demo` / `demo1234`. The AI assistant needs a free `GEMINI_API_KEY` from
[Google AI Studio](https://aistudio.google.com/apikey) in `server/.env`; everything else works
without one, and the widget degrades to a polite message if it's missing.

## Auth & the staff portal

Authentication is real, not a mock:

- `POST /api/auth/login` verifies a bcrypt hash and issues a 7-day JWT (rate-limited to
  5 attempts/minute).
- The client stores the token, validates it against `GET /api/auth/me` on boot, and guards
  `/dashboard` behind a `<ProtectedRoute>`. A 401 anywhere clears the session and redirects.
- `requireRole('admin', 'staff')` gates the whole `/api/admin` surface. **Staff are scoped to
  their own appointments** — the same endpoint returns a different result set for an admin
  than for a staff member.

Every figure on the dashboard is computed server-side from real bookings:

| Endpoint | Returns |
| --- | --- |
| `GET /api/admin/stats` | Today's bookings, utilisation, revenue, day-over-day deltas, a 7-day series, per-staff utilisation, and booking-source attribution |
| `GET /api/admin/bookings` | Filterable by date range, status and staff; service + staff populated |
| `PATCH /api/admin/bookings/:id` | Cancel or complete an appointment |

Booking **source attribution is genuine**: the assistant's `create_booking` tool writes
`source: 'assistant'` and the public booking form writes `source: 'web'`, so "56% of bookings
started in chat" is counted, not decorative.

## Deployment (Vercel)

Client and API ship as **one Vercel project** — the React build is served statically and
every `/api/*` request is routed into a single serverless function that runs the same
Express app used locally and in the tests (`api/[...slug].ts`). One origin, so no CORS.

Serverless has no persistent process, so the in-memory database used by `dev:demo` cannot be
used in production — you need **MongoDB Atlas**.

**1. Atlas**
- Create a database user dedicated to this demo (not an admin account).
- Network Access → allow `0.0.0.0/0`. Vercel functions have dynamic IPs, so an allowlist
  isn't viable; the strong password is what protects the cluster.
- Seed it once: put the Atlas URI in `server/.env` with `DEMO_MODE=true`, then `npm run seed`.
  *This drops the target database first.*

**2. Vercel environment variables**

| Variable | Notes |
| --- | --- |
| `MONGODB_URI` | Atlas SRV string |
| `JWT_SECRET` | long random string |
| `DEMO_MODE` | `true` |
| `CRON_SECRET` | long random string — Vercel sends it to the reset cron automatically |
| `GEMINI_API_KEY` | only needed for the AI assistant |
| `GEMINI_MODEL` | optional, defaults to `gemini-3.5-flash` |

`VITE_API_URL` is not required; production builds call a relative `/api`.

**3. Deploy**

```bash
npx vercel        # preview
npx vercel --prod # production
```

**Nightly reset.** `vercel.json` registers a cron that calls `GET /api/cron/reset` at 04:00
UTC, dropping and reseeding the demo. Without it a public demo rots — visitors cancel
appointments and fill the calendar. The endpoint requires `DEMO_MODE=true` plus a
constant-time match on `CRON_SECRET`, so it can't be triggered by anyone who finds the URL.

## Tests

```bash
npm test --workspace=server   # 54 tests
```

- `availability.test.ts` — the slot engine (working hours, buffers, lead time, time-off).
- `stats.test.ts` — utilisation maths as pure functions: interval overlap, bookings that
  overrun closing time, divide-by-zero guards, timezone boundaries.
- `admin.integration.test.ts` — the real HTTP stack against an in-memory MongoDB: login,
  token rejection, role enforcement, staff scoping, every dashboard figure, and the guards
  on the demo-reset endpoint.

## Design System

A fully themed interface built entirely on Tailwind v4 design tokens — no animation library,
no component kit, zero extra runtime dependencies.

- **Two themes, one token set** (`client/src/index.css`): every surface, hairline, shadow and
  glow resolves through a semantic variable (`--overlay-*`, `--hairline`, `--glass-bg`,
  `--shadow-card`…), so toggling `.dark` on `<html>` re-themes the entire app. Semantic tokens
  are registered with `@theme inline` so the generated utilities keep their `var()` reference
  instead of baking a value.
- **Theme switching**: `ThemeProvider` resolves saved choice → OS preference → dark, persists to
  `localStorage`, and keeps following the OS until the visitor picks a side. An inline boot
  script in `index.html` paints the correct theme before first render, so there's no flash of
  the wrong theme. The swap is crossfaded by a class applied for ~340ms, then removed so it
  can't slow ordinary hover transitions.
- **Tokens**: a brand/accent/ink colour ladder, a `Sora` display face paired with `Inter`, and
  ~20 named animations exposed as `--animate-*` theme variables.
- **Motion**: scroll reveals via `IntersectionObserver` (`<Reveal />`), count-up statistics
  (`<CountUp />`), a scripted looping chat demo in the hero, animated step transitions in the
  booking flow, and SVG sparklines that draw themselves on the dashboard.
- **Surfaces**: layered glassmorphism (`.glass`, `.glass-strong`), masked gradient hairline
  borders (`.border-gradient`), hover sheens, and drifting aurora blooms (`<Aurora />`).
- **Accessibility**: every animation collapses under `prefers-reduced-motion: reduce`, focus
  rings are visible throughout, brand foregrounds shift to a deeper ramp on light ground to
  hold contrast, and interactive controls carry accessible labels (the toggle is a proper
  `role="switch"` with `aria-checked`).

### Screens

| Route | What it demonstrates |
| --- | --- |
| `/` | Marketing landing page — animated hero demo, stats, bento features, testimonials |
| `/book` | Four-step booking flow with live availability and a sticky order summary |
| `/login` | Split-screen staff sign-in with one-click demo credentials |
| `/dashboard` | Staff portal — KPI sparklines, capacity chart, team utilisation, schedule |

## Setup & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Variables:
   Copy each `.env.example` to `.env` and fill it in. **Never commit `.env`** — both are
   git-ignored.
   - `server/.env` requires `MONGODB_URI` and `JWT_SECRET`; `GEMINI_API_KEY` is optional.
   - `client/.env` requires `VITE_API_URL` (default: `http://localhost:5000/api`).

3. Seed the Database:
   Ensure your MongoDB server is running. Then, populate the database with demo data:
   ```bash
   npm run seed
   ```
   *Note: Seeding requires `DEMO_MODE=true` in `server/.env`, and **drops the target
   database** before repopulating it.*

4. Run the Dev Servers:
   ```bash
   npm run dev
   ```

   Or skip steps 2–3 entirely with `npm run dev:demo --workspace=server` (see above).

## Demo Mode
The seeded database comes with pre-configured users for testing:
- **Admin**: `admin@slotly.demo` / `demo1234`
- **Staff**: `staff@slotly.demo` / `demo1234`

## Nightly Reset
To reset the demo environment automatically, schedule a CRON job on your server to run:
```bash
npm run reset
```

## Testing
```bash
npm test --workspace=server        # full suite
npm run test:watch --workspace=server
```
