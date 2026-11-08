# محمد صادقی | Dermatology demo

A Persian RTL, responsive dermatology workflow for one physician. The same Next.js app serves patient and doctor views. This repository is configured for synthetic demo data.

## Quick start

With Node.js 24 and npm, run the following from the extracted `derm-mvp` directory.

```sh
npm ci
cp .env.example .env
npm run demo
```

On Windows PowerShell, use `Copy-Item .env.example .env` for the second command. Open http://127.0.0.1:3000/login. The demo command starts a local PGlite database through a PostgreSQL-compatible TCP socket, runs Prisma migrations and seeds the sample accounts. Data is persistent in `.data/`.

The landing page can display optional before-and-after images from `public/skin-case-01.jpg` and `public/skin-case-02.jpg`. These files are excluded from Git. Add images only when they are approved for public display. The gallery is hidden when neither file is present.

For native PostgreSQL 17, start the Compose database using `docker compose up -d db` and run `npm run demo -- --external-db`. Keep the default database URL for the Compose settings, or change DATABASE_URL for your own local instance. Use one database per data directory. Local database port is 55432 and app port is 3000 by default. For an alternate app origin, set APP_ORIGIN to the exact browser origin. Set DERM_APP_PORT to select a different port for the demo launcher.

## Walk through the workflow

1. Enter as **سارا رضایی**, choose skin and/or hair or nutrition, and submit a request.
2. Switch to **پزشک نمونه** through Account → Logout. In Requests, approve or reject the new request.
3. Switch back to the patient. A simulated failed payment or cancellation leaves the request in the payment stage. A simulated success creates its queue entry.
4. In the physician queue, request completion. In the patient view, upload a synthetic PNG, JPEG or WebP and submit the intake. Nutrition-only intake can be submitted without a photo. An earlier seed case can be deferred with a reason.
5. Start review as doctor. Open Chat, exchange a few messages and close the initial episode explicitly.
6. Verify the next episode is locked for the patient. The doctor can advance the demo clock from that episode. The patient's first message opens it. Closing it schedules the second demo follow-up.
7. **مریم احمدی** starts with a seeded queue case and **علی محمدی** with a seeded follow-up waiting for its eligibility date.

Each package uses a configurable-in-code demo catalog price of ۱۰ میلیون تومان. The ۳۰-day delay is configured through FOLLOWUP_INTERVAL_DAYS and two follow-ups are shown for the demo. Private original bytes and WebP previews are stored separately outside `public`. The service worker caches public offline assets only.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run verify
```

The verification script creates an isolated PGlite test database and runs against the production build in demo mode. Its API checks cover the core workflow and file access. For the browser checks, it uses the bundled Linux x64 headless Chromium by default. On other platforms, set CHROMIUM_PATH to the absolute path of an installed Chrome/Chromium binary.

## Implementation choices and scope

- Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind CSS and lightweight local UI components. npm with a package lock is used. Pages use server-rendered data, server-side authorization and limited refresh polling.
- The UI uses a shared dashboard route with view and case selectors. A typed action endpoint handles workflow commands and dedicated private file endpoints handle original and preview bytes.
- Docker Compose supports PostgreSQL 17. PGlite is a local demo option. Demo mode uses seeded accounts, simulated payment outcomes and notification records. Starting this implementation in actual production mode is blocked.
- The 40-case source acceptance checklist is in the original handoff. The tests here cover the critical path and selected guardrails. See VERIFICATION.md for the checks actually run.
