# Data model

All data is stored in the browser's IndexedDB. The current schema version is `2` and is defined in `src/constants.ts`.

## Entities

### Person

Represents an individual associated with the Passport. The default record is `Me`, which cannot be deleted.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique identifier. |
| `name` | string | Display name. |
| `role` | `'me' \| 'partner' \| 'parent' \| 'child' \| 'trusted-helper' \| 'other'` | Relationship. |
| `notes` | string | Free text. |
| `visibility` | Visibility | Export visibility. |

### Device

A physical or virtual piece of technology.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique identifier. |
| `label` | string | Display name. |
| `role` | string | Short description of its role. |
| `category` | DeviceCategory | `phone`, `computer`, `tablet`, `router`, `modem`, `nas`, `home-server`, `smart-home-hub`, `backup-drive`, `printer`, `security-key`, `other`. |
| `ownerIds` | string[] | IDs of owning people. |
| `model` | string | Model name or number. |
| `os` | string | Operating system. |
| `serialNumber` | string | Serial number. |
| `purchaseDate` | string | ISO date string. |
| `location` | string | Physical location. |
| `encrypted` | TriState | `yes`, `no`, or `unknown`. |
| `recoveryReferenceIds` | string[] | Recovery references that apply. |
| `notes` | string | Free text. |
| `visibility` | Visibility | Export visibility. |
| `reviewDate` | string | ISO date string. |

### Account

An online account, service, or subscription.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique identifier. |
| `label` | string | Display name. |
| `provider` | string | Provider or company. |
| `purpose` | string | What it is for. |
| `personIds` | string[] | Associated people. |
| `mfa` | TriState | `yes`, `no`, or `unknown`. |
| `recoveryReferenceIds` | string[] | Recovery references that apply. |
| `notes` | string | Free text. |
| `visibility` | Visibility | Export visibility. |
| `reviewDate` | string | ISO date string. |

### Backup

A backup set or routine.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique identifier. |
| `label` | string | Display name. |
| `destination` | string | Where backups are stored. |
| `recoveryReferenceIds` | string[] | Recovery references that apply. |
| `coversIds` | string[] | IDs of devices or accounts covered. |
| `copies` | `'one' \| 'multiple' \| 'unknown'` | Number of copies. |
| `lastCheckedDate` | string | ISO date of last check. |
| `restoreTestedDate` | string | ISO date of last restore test. |
| `restored` | TriState | Whether a restore has been tested. |
| `canRestorePersonIds` | string[] | People able to perform a restore. |
| `notes` | string | Free text. |
| `visibility` | Visibility | Export visibility. |
| `reviewDate` | string | ISO date string. |

### RecoveryReference

A pointer to how something can be recovered, without storing the actual secret.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique identifier. |
| `label` | string | Display name. |
| `kind` | RecoveryKind | `password-manager`, `physical-safe`, `printed-sheet`, `provider-account`, `trusted-person`, `support-contact`, `other`. |
| `location` | string | Where to find it. |
| `contactInfo` | string | Contact details if relevant. |
| `notes` | string | Free text. |
| `visibility` | Visibility | Export visibility. |

### Dependency

A directed link between two entities.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique identifier. |
| `sourceId` | string | Entity that depends on the target. |
| `targetId` | string | Entity being depended on. |
| `kind` | DependencyKind | `requires`, `authenticates-with`, `backed-up-to`, `other`. |
| `notes` | string | Free text. |

### ReviewItem

A generated or manually created attention item.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique identifier. |
| `title` | string | Human-readable title. |
| `recurrenceDays` | number \| null | How often to review; `null` for one-off. |
| `lastReviewedDate` | string | ISO date of last review. |
| `nextReviewDate` | string | ISO date of next review. |
| `status` | `'ok' \| 'due' \| 'overdue' \| 'snoozed'` | Current status. |
| `notes` | string | Free text. |
| `linkedEntityIds` | string[] | Related entity IDs. |
| `source` | `'app' \| 'user'` | `app` for generated global reminders; `user` for manually created items. |

## Visibility classifications

Every `Person`, `Device`, `Account`, `Backup`, and `RecoveryReference` has a `visibility` field:

- `private` — included only in a full JSON backup.
- `helper-safe` — safe to share with a trusted helper.
- `emergency` — essential information for an emergency contact.
- `backup-only` — included only in a full JSON backup; never shown in helper or emergency exports.
- `do-not-export` — legacy name for `backup-only`; migrated automatically on import.

Dependencies are included only if both linked entities are included in the export. Dependency notes are included only when both endpoints are included, because a dependency whose context is missing could reveal information about an excluded entity.

Review items are included in helper or emergency exports only when:

- every linked entity is included, or
- the item is unlinked and `source === 'app'` (recognized app-generated global reminders such as the canonical "Export your Passport" reminder).

Manually created unlinked review items (`source === 'user'`) are excluded from helper and emergency exports because the app cannot prove their free text is safe to share.

## In-memory state and persistence

`store.ts` keeps the full `AppState` in memory. Mutations trigger subscribers and queue a debounced save to IndexedDB. `db.ts` reads and writes each entity type to a separate object store. On first load, if no people exist, the store creates the default `Me` person.

The shape of `AppState` is also the shape of a full JSON export (`AppBackup`), plus an `exportedAt` timestamp on exports.

## Schema migration

`src/services/migration.ts` upgrades older backups to the current schema version. Current migrations include:

- Renaming legacy `do-not-export` visibility to `backup-only`.
- Adding `source` to legacy `ReviewItem` records: the canonical unlinked "Export your Passport" reminder is marked `app`; all other legacy review items default to `user`.
- Ensuring at least a default `Me` person exists.

Imports validate the backup before migration and reject data that cannot be safely upgraded.
