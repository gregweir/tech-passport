# Export model

Tech Passport can export your data in two formats: a full JSON backup and a human-readable HTML Passport. All exports happen in the browser; no data is sent to a server.

## Full JSON backup

`buildFullExport(state)` creates an `AppBackup` object that mirrors the in-memory state and adds `exportedAt`. It includes:

- All people, devices, accounts, backups, and recovery references.
- All dependencies and review items.
- Metadata: schema version, onboarding status, and last-export timestamp.

This is the only export that includes `private` visibility items. Items marked `backup-only` (or the legacy `do-not-export`) are also included because a full backup is stored by you, for you.

## Filtered JSON exports

- **Helper copy** — `buildHelperExport(state)` includes only `helper-safe` and `emergency` items.
- **Emergency copy** — `buildEmergencyExport(state)` includes only `emergency` items.

Filtered exports apply these rules:

- Entities whose visibility is not in the chosen set are dropped.
- Device `ownerIds` and account `personIds` are filtered to included people only.
- Device/account/backup `recoveryReferenceIds` are filtered to included recovery references only.
- Backup `canRestorePersonIds` are filtered to included people only.
- Backup `coversIds` are filtered to included devices and accounts only.
- Dependencies are included only when both endpoints are included.
- Review items are included only when every linked entity is included, or when the item is an unlinked app-generated global reminder (`source === 'app'`).

No identifier belonging to an excluded record appears in a helper or emergency export.

## HTML Passport export

`buildPassportHtml(state, options)` produces a self-contained, printable HTML page with:

- A title, subtitle, and sensitivity notice.
- A priority-action summary for missing backups, overdue checks, untested restores, and due reviews.
- Sections for people, devices, accounts, backups, recovery references, dependencies, and scheduled checks.
- An omission summary listing what the filtered copy intentionally left out.
- An export footer with the current date.

### HTML escaping

All user-controlled text in the generated HTML is escaped by default. A separate, conspicuously named helper renders the small amount of trusted app-generated markup (for example, the italicized "Not recorded" and "No backup recorded" spans). Values that are escaped include every device, account, backup, recovery-reference, dependency, and review-item field, plus priority-action summaries, omission summaries, title, subtitle, and sensitivity notice.

The exported HTML also includes a restrictive `<meta http-equiv="Content-Security-Policy">` as defense in depth. The policy forbids scripts, frames, objects, and external resources while allowing the inline style block.

### In-app preview

The Export/Import view previews the helper-safe Passport in a sandboxed `<iframe srcdoc>`. The iframe document is the standalone exported HTML, so the preview benefits from the same escaping and CSP. The parent app never injects the HTML into its own DOM with `innerHTML`.

## Export actions

The Export/Import view provides four export buttons:

- **Full JSON backup** — complete data as JSON.
- **Helper copy** — helper-safe HTML.
- **Emergency copy** — emergency-only HTML.
- **Passport HTML** — helper-safe HTML with a print-friendly layout.

## Import behavior

Importing a JSON backup replaces all current Passport data. The import flow:

1. Rejects files larger than 5 MiB before reading (using `File.size`), and re-checks encoded byte size in the parser.
2. Parses the file as JSON.
3. Validates that the root is an object with a `schemaVersion` number.
4. Rejects backups from newer schema versions.
5. Validates every entity field, including:
   - type-specific relationships (for example, device owners must be people, backup `coversIds` must be devices or accounts, dependency and review endpoints must be eligible entity types),
   - cross-type duplicate IDs,
   - enum values (malformed values are rejected, not silently converted),
   - real calendar dates,
   - semantic ISO timestamps,
   - non-negative `recurrenceDays` within a sensible upper bound.
6. Runs `migrateBackup` to bring older backups up to the current schema version.
7. Shows a browser confirmation before overwriting the in-memory state.
8. Calls `importBackup(backup)` in the store, which replaces the current state and queues a save to IndexedDB.

There is no merge or conflict resolution. Import is all-or-nothing.

## Sensitivity guidance

- A full JSON backup contains everything, including private items. Store it somewhere you trust.
- A helper or emergency HTML copy is intended for trusted contacts. Be selective about what you mark as `helper-safe` or `emergency`.
- Never email, message, or store exports in a place where people you do not trust can read them.
- Exports contain metadata, not passwords or keys, but metadata about your devices and accounts can still be sensitive.
