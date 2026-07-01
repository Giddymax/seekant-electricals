# Seekant Electricals — Web App

A Next.js 16 + Tailwind v4 + Supabase rewrite of the Electron desktop POS at `../app-unpacked`. The original app is **untouched**; this folder is fully self-contained.

## Stack

- **Framework** — Next.js 16 (App Router with server components + server actions)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4 (`@import "tailwindcss"` + `@theme`), CSS custom properties, inline styles for layout parity with the desktop shell
- **UI** — Radix UI primitives (Label, Select, Slot) + shadcn/ui-style wrappers in `src/components/ui`
- **Data + Auth** — Supabase (Postgres via `@supabase/supabase-js`; `@supabase/ssr` for server/client)
- **PWA** — `public/manifest.json`, `public/sw.js`, apple-web-app metadata in the root layout

## Getting started

```bash
cd webapp
npm install
cp .env.example .env.local   # fill in Supabase keys + device auth password
npm run dev
```

Open <http://localhost:3000>. First visit prompts for the one-time **device authorization password** (default `12Nanakwaku*`, matches the desktop app). Then log in as `admin` / `admin123` or `staff` / `staff123`.

## Supabase setup

1. Create a Supabase project.
2. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the `service_role` key into `.env.local`.
3. In the Supabase SQL editor, run:
   - `supabase/schema.sql` — creates tables and seeds the two default users + the settings row
   - `supabase/seed-inventory.sql` — (optional) adds the starter electrical inventory that the desktop app ships with
4. Reload the app.

RLS is intentionally disabled — the Next.js layer authenticates users via a custom cookie and only the server (with the service-role key) touches the database. If you switch to Supabase Auth, enable RLS and add policies.

## Feature parity with the desktop app

| Desktop feature | Web equivalent |
| --- | --- |
| Login (admin / staff) | `/login` route + `seekant_session` cookie |
| Sidebar tabs | `src/components/Sidebar.tsx` |
| Top stats bar | `src/components/StatsBar.tsx` |
| Inventory CRUD | `/` (dashboard root) |
| POS cart + checkout + receipt | `/sales` |
| Sales history + part payments | `/history` |
| Summary reports + print | `/summary` (admin) |
| Accounts management | `/accounts` (admin) |
| Branding / receipt settings | `/settings` (admin) |
| Backup / restore | `/api/backup` (download JSON), `/api/restore` (POST JSON) |

## Notes

- Receipts and summary reports print through the browser's native print dialog (same UX as the desktop app's `window.open` + `window.print` flow).
- Product images are stored as data URLs in the `pos_products.image` column — swap for Supabase Storage if you need bigger images.
- The original Electron files under `../app-unpacked` are **not** modified.
