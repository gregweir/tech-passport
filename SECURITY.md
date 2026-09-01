# Security

Tech Passport is a browser-only application. It keeps your data on your device and never sends it to a server in normal use.

## What is stored

All data is stored in the browser's IndexedDB on the device where you use Tech Passport:

- Recovery references — descriptions of where recovery information lives (for example, "password manager", "printed sheet in safe", "trusted person"), but not the actual secrets.
- Device and account metadata — labels, roles, categories, ownership, notes, visibility settings, and review dates.
- Backup metadata — destinations, copy counts, last-checked dates, and restore-test status.
- Dependency links between entities.
- Generated review/attention items.

## What is not stored

Tech Passport intentionally does **not** store, request, or encourage storing:

- Passwords, PINs, or passphrases.
- MFA or TOTP seeds.
- Recovery codes.
- API keys, private keys, or cryptographic keys.
- Cryptocurrency seed phrases.

If a field looks like it may contain a secret, the app shows a warning but does not block you from saving. The warning is a reminder, not a guarantee.

## Trust assumptions and limitations

Users trust:

- **Browser and device:** Anyone with access to the device or browser profile can open the app and read the data stored in IndexedDB.
- **Exports:** Exported JSON or HTML files are only as safe as the places you choose to store them. If you save an export to a shared drive or send it to someone, assume the recipient can read it.
- **Hosted origin:** Any JavaScript served from `techpassport.tartanleaf.com` executes with access to that origin's IndexedDB. Users trust Tartanleaf’s hosting, deployment process, domain, TLS configuration, and every update delivered by the site.
- **Local environment:** Browser extensions and the local operating system can also read browser data.
- **No server backup:** There is no cloud database, server-side storage, or automatic backup. Browser data loss means losing your Passport unless you have exported it.

This is a personal record-keeping aid, not a managed backup, security, compliance, or emergency-response service.

## How to report security concerns

If you discover a security issue in Tech Passport, please report it privately through GitHub’s private vulnerability reporting for this repository, or email gweir@tartanleaf.com. Do not include sensitive personal data or example secrets in your report.

The `gweir@tartanleaf.com` mailbox is the monitored security contact for this project. Please allow a reasonable response time; Tech Passport is a free community utility rather than a managed or continuously monitored service.
