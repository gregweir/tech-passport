# Contributing to Tech Passport

Tech Passport is a small, browser-only personal inventory utility published by Tartanleaf.com Inc. Contributions that keep it simple, safe, and offline-first are welcome.

## Project scope and audience

The target user is a non-specialist who wants an understandable record of the technology they depend on. Keep the UI plain, the language friendly, and the behavior predictable.

Scope:

- Browser-only PWA using plain TypeScript and Vite.
- Data stays in the browser's IndexedDB; no cloud or server-side storage.
- No secrets (passwords, PINs, MFA seeds, recovery codes, keys, seed phrases) are stored or encouraged.
- Imperative DOM factories, not a frontend framework.

## Development workflow

1. Clone the repository.
2. Run `npm install`.
3. Run `npm run typecheck` and `npm test` before committing.
4. For UI changes, run the dev server with `npm run dev` and exercise the relevant view manually.
5. For Docker changes, run `npm run docker:build` and `npm run docker:run`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm test` | Run unit and DOM tests. |
| `npm run typecheck` | Type-check the project. |
| `npm run lint` | Lint `src` and `tests`. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Serve the production build locally. |
| `npm run docker:build` | Build the Docker image. |
| `npm run docker:run` | Run the Docker container on port 8080. |
| `npx playwright test` | Run e2e tests (starts its own dev server on port 8080). |

## Style notes

- **Plain TypeScript:** No React, Vue, Svelte, or similar framework. Use small factory functions that return DOM elements.
- **Safe rendering:** Never use `innerHTML` for user-provided content. Prefer `textContent`, `createElement`, and explicit attribute setting. `buildPassportHtml` uses a dedicated escape helper and only interpolates trusted app-generated strings.
- **No secrets:** Do not add fields or features that ask for, store, or export passwords, PINs, MFA seeds, recovery codes, keys, or seed phrases.
- **Browser-only persistence:** Keep data in IndexedDB. Do not add cloud sync, accounts, telemetry, analytics, or server-side storage.
- **Visibility:** Entities can be `private`, `helper-safe`, `emergency`, or `backup-only`. Respect these values in any export or shared view. Legacy backups may contain `do-not-export`, which is treated identically to `backup-only` on import.
- **Accessibility:** Aim for WCAG 2.2 AA. Use semantic elements, visible focus indicators, associated labels, and keyboard support.
- **Tests:** Add unit tests for services and utilities, DOM tests for components, and e2e tests for critical user flows.

## Continuous integration

GitHub Actions runs typecheck, lint, unit tests, build, and Playwright e2e tests on every push and pull request. See `.github/workflows/ci.yml`.

## Before submitting

- `npm run typecheck` passes.
- `npm test` passes.
- `npm run lint` passes.
- `npx playwright test` passes.
- The change does not expand the project into cloud/server-side features or secret storage.

If your change affects exports, import, or persistence, update the relevant documentation in `docs/`.
