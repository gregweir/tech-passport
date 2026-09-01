# Architecture

Tech Passport is a Vite-built, plain TypeScript single-page application (SPA). It has no frontend framework and no server-side component.

## Overview

- **Build tool:** Vite with `vite-plugin-pwa` for the service worker and offline assets.
- **Language:** TypeScript in strict mode.
- **Routing:** Lightweight hash-based router (`src/router.ts`) with parameterized routes such as `/people/:id/edit`.
- **State:** A reactive in-memory store (`src/store.ts`) that syncs to IndexedDB via `idb`.
- **Persistence:** IndexedDB wrapper (`src/db.ts`) with one object store per entity type plus a metadata store.
- **UI:** Imperative DOM factories in `src/components/` and view factories in `src/views/`.
- **Services:** Isolated functions for export, import, migrations, review generation, and secret-risk heuristics.
- **Styling:** Plain CSS with design tokens in `src/app.css`.
- **Testing:** Vitest with jsdom and `fake-indexeddb` for unit/DOM tests; Playwright for e2e tests.
- **Docker:** Multi-stage Dockerfile building the static bundle and serving it with nginx as a non-root user.

## File layout

```text
TechPassport/
  src/
    main.ts                    # Bootstrap: shell, nav, router, persistence sync
    index.html                 # App shell with CSP
    app.css                    # Design tokens and component styles
    types.ts                   # Domain types
    constants.ts               # Schema version, default Me, enums
    router.ts                  # Hash router with param support
    db.ts                      # IndexedDB wrapper via idb
    store.ts                   # In-memory state, actions, persistence sync
    utils/
      id.ts                    # ID generation
      date.ts                  # Date helpers
      validators.ts            # Input validation helpers
      secretWarnings.ts        # Heuristic secret detection
      exportFilter.ts          # Visibility-based filtering
      validateBackup.ts        # Import validation and size limits
    services/
      export.ts                # JSON and HTML export builders
      import.ts                # Import parsing and validation
      migration.ts             # Schema migrations
      reviewGenerator.ts       # Attention / review item generator
    components/
      app-shell.ts             # Layout with nav slot
      nav.ts                   # Navigation links
      button.ts                # Button component
      form-field.ts            # Labeled input wrapper
      select.ts                # Styled select
      multi-select.ts          # Multi-select for many-to-many relations
      card.ts                  # Entity summary card
      entity-list.ts           # List + empty state
      modal.ts                 # Modal dialog
      confirm-dialog.ts        # Destructive-action confirmation
      attention-badge.ts       # Status badge
      visibility-select.ts     # Visibility dropdown
    views/
      dashboard.ts             # Dashboard view
      onboarding.ts            # Onboarding wizard
      person-list.ts / person-edit.ts
      device-list.ts / device-edit.ts
      account-list.ts / account-edit.ts
      backup-list.ts / backup-edit.ts
      recovery-list.ts / recovery-edit.ts
      dependency-list.ts / dependency-edit.ts
      review-list.ts           # Review item list
      passport-view.ts         # Human-readable Passport preview
      export-import.ts         # Export/import page
      not-found.ts             # 404 view
  public/
    manifest.json              # PWA manifest
    icons/                     # PWA icons
  tests/e2e/                   # Playwright e2e specs
  package.json
  vite.config.ts
  tsconfig.json
  eslint.config.js
  vitest.config.ts
  Dockerfile
  nginx.conf
  docker-compose.yml
```

## Router

`createRouter` takes a map of hash paths to factory functions and renders the matching view into a container. Parameterized segments like `:id` are parsed and passed to the handler. Unknown routes fall through to the `*` handler.

## Store and persistence

`store.ts` holds a mutable in-memory `AppState`. Every mutating action creates a new state object, notifies subscribers, and queues an IndexedDB save after a short debounce. On first load, `hydrate()` reads the saved state from IndexedDB, defaulting to a single `Me` person if the database is empty.

`db.ts` uses the `idb` library to read and write each entity type to its own IndexedDB object store. Saving clears each store before writing to remove stale records.

## Components and views

Components are small TypeScript functions that create and return DOM elements. They do not use a virtual DOM. Views compose components and subscribe to or read from the store to render screens. All dynamic text is set with safe APIs; `innerHTML` is not used for user input.

## Services

- **export.ts** builds full, helper-safe, and emergency JSON backups, plus a human-readable HTML Passport. All HTML output is escaped by default; a dedicated helper renders the small amount of trusted app-generated markup.
- **import.ts** parses a JSON backup and coordinates validation, migration, and confirmation.
- **validateBackup.ts** enforces type-specific relationships, cross-type duplicate IDs, real calendar dates, semantic timestamps, valid enums, and size limits.
- **migration.ts** upgrades older backups to the current schema version, renames legacy `do-not-export` to `backup-only`, assigns `source` to legacy review items, and ensures at least a default `Me` person exists.
- **reviewGenerator.ts** scans devices, accounts, backups, and export history to produce review/attention items.
- **secretWarnings.ts** heuristically flags text that resembles passwords, TOTP seeds, or seed phrases, showing a warning but never blocking saves.

## Save status

The store debounces IndexedDB writes and exposes a save-status indicator in the UI. A failure to write (for example, because storage is full) surfaces a non-blocking alert so the user knows their latest changes may not persist. Successful saves clear the error.

## PWA update behavior

`vite-plugin-pwa` registers a service worker with the `prompt` strategy. When a new build is available, the app shows a simple "Update available" prompt. The user can choose to reload and activate the new version. Until then, the existing service worker continues serving the previously cached app shell and assets. The production nginx configuration prevents long-term caching of `index.html`, `sw.js`, and `manifest.json` while giving hashed build assets immutable cache headers.
