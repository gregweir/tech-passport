# Tech Passport

[![CI](https://github.com/gregweir/tech-passport/actions/workflows/ci.yml/badge.svg)](https://github.com/gregweir/tech-passport/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

**[Open Tech Passport](https://techpassport.tartanleaf.com/)**

Tech Passport is a free, open-source, local-first community utility published by Tartanleaf.com Inc. It is a personal planning and record-keeping aid for the technology your life depends on — your phone, computer, accounts, backups, and how to recover if something goes wrong.

It is **not** a managed backup, security, compliance, or emergency-response service.

## Before you begin

Tech Passport stores its records in the browser profile where you use it. Clearing site data, using a different browser profile, or losing the device can remove access to those records. Export a JSON backup after setup and whenever you make important changes, then keep that file in a secure location you control.

Do not enter passwords, PINs, MFA seeds, recovery codes, private keys, API keys, or cryptocurrency seed phrases.

## What it does

- Document people, devices, accounts, backups, and recovery references.
- Link related items with dependencies such as “requires,” “authenticates-with,” and “backed-up-to.”
- Flag attention items, such as missing recovery references, untested backups, and overdue exports.
- Export a full JSON backup or a filtered human-readable HTML Passport.
- Import a previously exported JSON backup (this replaces all current data).
- Work offline as an installable PWA after the first load.

## Important limitations

- Data is stored only in your browser's IndexedDB. There is no cloud storage, server-side backup, or sync.
- Clearing browser data for this site will delete your Passport.
- A different browser or browser profile will show a different Passport.
- Tech Passport does not store passwords, PINs, MFA seeds, recovery codes, keys, or seed phrases.
- This is not a formal compliance, audit, or disaster-recovery tool.

## Trust boundary

Tech Passport runs entirely in your browser, and your data never leaves your device in normal use. Because the application is loaded from a hosted origin, users also trust:

- Tartanleaf’s hosting and deployment process.
- The code delivered by `techpassport.tartanleaf.com` on every update.
- The domain and TLS configuration.
- The browser, browser extensions, and local operating system.

The production site contains no analytics, tag managers, advertising, externally hosted scripts, support widgets, or third-party fonts.

## Local commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run dev` | Start the Vite dev server. |
| `npm test` | Run the Vitest unit and DOM tests. |
| `npm run typecheck` | Run TypeScript with no emit. |
| `npm run lint` | Run ESLint on `src` and `tests`. |
| `npx playwright test` | Run Playwright e2e tests (starts its own dev server). |
| `npm run build` | Type-check and build the production bundle to `dist/`. |
| `npm run preview` | Preview the production build on port 8080. |
| `npm run docker:build` | Build the Docker image. |
| `npm run docker:run` | Run the Docker container on port 8080. |
| `./scripts/verify-headers.sh` | Build and run the Docker image, then print cache/security headers for key paths. |

Playwright e2e tests start their own dev server on `http://localhost:8080` by default and do not require a separate server. Use `PLAYWRIGHT_BASE_URL` to target a different origin, for example:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8080 npx playwright test
```

The e2e suite includes automated accessibility scans with `@axe-core/playwright` covering every page, plus a mobile hamburger-menu test.

## Project status

This is an early-stage, local-first utility. It makes no claims of formal security certification or compliance.

## Attribution

Developed by Greg Weir.

Published as open-source software by [Tartanleaf.com Inc.](https://tartanleaf.com)

## License

This software is licensed under the MIT License. See [LICENSE](./LICENSE).

The MIT License covers the software. It does not grant permission to use the Tartanleaf name, logo, or Tech Passport product branding to imply endorsement. See [BRANDING.md](./BRANDING.md).
