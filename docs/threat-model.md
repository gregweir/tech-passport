# Threat model

This document describes the security assumptions and limitations of Tech Passport as implemented. It is not a formal security certification.

## Product classification

Tech Passport is a free, open-source, local-first community utility published by Tartanleaf.com Inc. It is a personal planning and record-keeping aid, not a managed backup, security, compliance, or emergency-response service.

## Trust boundaries

Users trust all of the following:

1. **Browser runtime.** The application runs entirely in the browser. You trust the browser, its extensions, and the operating system on your device.
2. **User device.** All data lives in the browser's IndexedDB on that device. Anyone who can unlock and use the device can open Tech Passport and read the data.
3. **Exported files.** Once a file leaves the browser, it is under your control. Its safety depends on where you store it and who you share it with.
4. **Hosted origin.** Any JavaScript served from `techpassport.tartanleaf.com` executes with access to that origin's IndexedDB. Users trust Tartanleaf’s hosting and deployment process, the code delivered on every update, the domain, and the TLS configuration.
5. **No server boundary.** There is no server, cloud API, database, or sync service operated by Tech Passport. Data never crosses a network boundary unless you choose to move an exported file.

## What an attacker could gain

### Local device access

If an attacker has physical or remote access to your unlocked device, they can:

- Open Tech Passport and read all stored records.
- Extract the IndexedDB contents using browser developer tools.
- Replace the data by importing a malicious backup if they can interact with the UI.

Mitigation: keep your device locked, use a password or biometric lock, and do not leave Tech Passport open on shared devices.

### Hosted-origin compromise

A compromised deployment or careless future addition at `techpassport.tartanleaf.com` could:

- Serve JavaScript that reads or exfiltrates existing IndexedDB data.
- Change application behavior, including export or import handling.

Mitigation: the production site contains no analytics, tag managers, advertising, externally hosted scripts, support widgets, or third-party fonts. Release builds should be reproducible and deployments should be reviewed.

### Exported file access

If an attacker gains access to an exported JSON or HTML file, they can:

- Read all metadata included in that export (devices, accounts, backup locations, recovery references, notes, dependencies).
- Identify what technology you have and how it is backed up.

They cannot learn actual passwords, PINs, MFA seeds, recovery codes, or keys from a Tech Passport export because the app does not store them.

Mitigation: store exports in encrypted, access-controlled locations. Share helper or emergency copies only with people you trust.

### Malicious backup import

A crafted JSON backup could be imported and would overwrite all current data. The import parser validates JSON structure, schema version, required fields, enumerated values, real calendar dates, semantic ISO timestamps, IDs, duplicate IDs within and across entity types, type-specific relationships, and size limits. It does not cryptographically sign backups.

Mitigation: only import backups you created yourself or received from a trusted source.

### Exported HTML injection

If user-entered text were inserted unescaped into a Passport HTML export, a downloaded file opened in a browser could execute scripts or trigger event handlers. All user-controlled values in the generated HTML are escaped, and a restrictive CSP meta tag is included as defense in depth.

Mitigation: review `buildPassportHtml` in `src/services/export.ts` and its regression tests before adding any new interpolated field.

## What cloud/server-side storage is excluded

Tech Passport deliberately does not include:

- Cloud databases, object storage, or backup services.
- User accounts, authentication, or authorization servers.
- Telemetry, analytics, crash-reporting, or marketing services.
- Server-side sync or multi-device state.

This keeps the trust boundary small — the application, the browser, your device, and the hosted origin — but it also means there is no server-side recovery if you lose the device or its data.

## Limitations

- Secret detection is heuristic and imperfect. It may miss some secrets or flag innocuous text.
- There is no encryption at rest beyond what the browser and operating system provide.
- There is no audit log of reads or changes.
- The application is not designed to resist a determined attacker with full control of your unlocked device.
