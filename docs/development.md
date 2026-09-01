# Development guide

This document covers how to set up the project locally and run tests, builds, and Docker.

## Setup

1. Clone the repository.
2. From the repository root, run:

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

## Command reference

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Type-check and build the production bundle to `dist/`. |
| `npm run preview` | Preview the production build on `http://localhost:8080`. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm run lint` | Run ESLint on `src` and `tests`. |
| `npm test` | Run all Vitest tests once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run docker:build` | Build the Docker image `tech-passport`. |
| `npm run docker:run` | Run the Docker container on port 8080. |
| `npx playwright test` | Run Playwright e2e tests. |

## Running tests

Unit and DOM tests use Vitest with jsdom and `fake-indexeddb` for IndexedDB support. They run with:

```bash
npm test
```

You can run a subset of tests by path:

```bash
npm test -- src/services
```

E2E tests use Playwright and expect the dev server to be running at `http://localhost:5173`:

```bash
npm run dev &
npx playwright test
```

## Docker

The Docker setup builds the static app and serves it with nginx on port 8080 as a non-root user (`appuser`, uid 1000).

Build and run:

```bash
npm run docker:build
npm run docker:run
```

Or use Docker Compose:

```bash
docker compose up --build
```

The nginx configuration falls back to `index.html` for all non-asset routes so the client-side hash router works on refresh.

## Project structure

- `src/` — application source.
- `src/index.html` — app shell with a Content-Security-Policy.
- `src/main.ts` — bootstrap and router wiring.
- `src/store.ts` — in-memory reactive store with IndexedDB sync.
- `src/db.ts` — IndexedDB persistence layer.
- `src/router.ts` — hash router.
- `src/services/` — export, import, migrations, review generation.
- `src/utils/` — helpers for IDs, dates, validation, visibility filtering, and secret warnings.
- `src/components/` — imperative DOM component factories.
- `src/views/` — page-level view factories.
- `public/` — static assets including the PWA manifest and icons.
- `tests/e2e/` — Playwright e2e tests.

## Notes

- The dev server root is `src/`. Public assets are served from `public/`.
- The build outputs to `dist/`.
- TypeScript paths map `@/*` to `src/*`.
- Keep data browser-only: do not add cloud or server-side storage of Passport data.
- Do not add fields or features that store passwords, PINs, MFA seeds, recovery codes, keys, or seed phrases.
