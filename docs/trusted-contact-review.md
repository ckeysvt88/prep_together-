# Trusted Contact Authentication — pre-deployment review

Prepared November 18, 2026. This change is intended for review on a separate branch before merging to `main` and deploying the GitHub Pages site.

## Completed behavior

- Added a high-contrast Trusted Contact Authentication card inside the existing Communications section, available to all experience levels and household sizes. The expandable quick start explains enrollment and suspicious-call verification in five steps.
- Implemented session-only, labeled contacts/groups (up to 12 entries), secure new-key generation, private QR enrollment, manual setup-key entry/import, current six-digit TOTP and a 30-second countdown. Entry selection, hide, remove and clear-all controls are included.
- Reused the locally bundled MIT QR encoder from the supplied Offline Code Setup HTML, preserving its license. TOTP is implemented with browser Web Crypto; no third-party network API or runtime package dependency is introduced.
- Added a normal planner action with To do / Done / Not needed, public buying-guide/PDF education in all three report modes, an eighth tutorial step, updated source notes, README, and CI authentication checks.
- Added a fixed public-file offline cache to the existing PWA. The prior version had a manifest/icons but no service worker. The worker caches the complete public planner, PDF library, static PDFs, icons and sources; it never receives secrets or caches arbitrary runtime requests.

## Security decisions

Generated secrets are 20 random bytes (160 bits), Base32 encoded. Enrollment is `otpauth://totp/` with issuer Ready Together, HMAC-SHA-1, six digits and 30-second periods. Imported keys must be canonical, unpadded Base32 encoding of 16–64 bytes. Web Crypto signing keys are non-extractable; the enrollment secret remains in memory to render the private QR/manual key.

There is deliberately no browser persistence or secret backup feature. Contacts, QR payloads, keys and current codes do not enter planner state, saved JSON or PDF snapshots. They clear on reload/page exit and confirmed plan reset. Displays hide in the background and on printing. Clearing in the browser does not revoke entries already enrolled elsewhere. JavaScript memory clearing is best effort, not guaranteed secure erasure.

The module states plainly that a matching code demonstrates shared-key possession, not identity. It documents guessing, brief replay, live relay, group-member impersonation, compromised devices, authenticator sync, and key replacement. Suspicious financial requests or emergency claims require an independent callback to a previously trusted number even after a match. Radio use adds no encryption or licensing exemption. Immediate danger requires emergency care, without waiting for a code.

## Verification completed

| Check | Result |
| --- | --- |
| Existing planning/medical suite | 33/33 passed |
| New authentication suite | 11/11 passed |
| RFC 6238 Appendix B SHA-1 vectors | All six 8-digit vectors and corresponding 6-digit outputs passed |
| Independent Node HMAC comparison | Passed at interval boundaries, leading-zero outputs, future timestamps and the running browser’s displayed code |
| Random generation | 128 generated 160-bit secrets were unique and canonical |
| QR decoding | Independent ZXing decoder recovered exact URIs for ordinary, multilingual/emoji and maximum-length emoji labels (145, 190 and 612 ASCII URI characters) |
| Browser enrollment UI | Generated QR/code, imported a public RFC test key, switched between labeled entries, hid/revealed and cleared session entries |
| Rotation/countdown | Browser code changed across periods; displayed RFC-key code matched independent calculation |
| Session privacy | Cleared QR and code DOM on hiding; session entries and nickname fields empty after online and offline reload |
| Backup isolation | Downloaded JSON excluded test secrets and session labels; Not needed status survived |
| PDF export | Combined, action-only and shopping-only downloads contained callback/security guidance and excluded session labels/URI; all text spans stayed within page bounds |
| PDF visual inspection | Dedicated two-page trusted-contact worksheet reviewed for readable headings, table, instructions, safeguards and source links |
| Offline integration | Stopped the preview app server, reloaded the cached planner, generated a new key/QR/code, and downloaded all three PDF report types without the app server; reloading cleared private session data |
| Offline worker regressions | Public asset paths/versioned scripts/subdirectory support, atomic readiness, failed install, stale cache cleanup, navigation fallback and unknown/private-query bypass passed |
| Responsive browser check | 375-pixel frame (360-pixel content viewport) had matching client/scroll widths; setup and QR fit without horizontal overflow |
| Tutorial | Eight steps; step 6 targeted the trusted-contact card with the existing high-contrast spotlight |
| Syntax / whitespace | JavaScript syntax checks and `git diff --check` passed |

QR decoder packages were installed only in a temporary QA directory; they are not application or CI dependencies. Browser tests used synthetic labels and public RFC fixtures only. A Chrome extension metadata error appeared in the testing environment; no app-origin console error was observed.

## Verification limits and operational checks

This environment cannot physically scan the QR with iOS/Android 2FAS or VIP Access. URI/matrix decoding and independent TOTP synchronization passed, and the enrollment instructions were checked against primary app documentation. Before relying on an entry, both participants must enroll their actual devices and confirm matching codes, correct clocks and airplane-mode operation. VIP Access custom-QR support is version-dependent; the UI provides a 2FAS/manual-entry fallback.

Responsive QA used a Chromium frame; it does not certify every Safari/iOS/Android version. The offline test removed the app server rather than changing a physical phone’s network setting. Test installation and airplane-mode reopening on the target phone before an outage. Browser/OS storage eviction remains possible. An enrolled authenticator is the intended ongoing private-key store.

The older downloadable Beginner and Complete reference PDFs remain separate reading resources; this module updates the personalized reports generated by the planner. There is no external security audit, server-side replay prevention, identity proof, recovery service, encrypted web vault or remote revocation.

## Deployment and rollback

The release is approved for publication. The production workflow deploys on pushes to `main` or an explicit manual run. A dedicated manual rollback workflow deploys the pinned pre-authentication app and retires the installed public-file cache; see [rollback instructions](rollback-trusted-contact.md). Version 1.10 introduces cache `ready-together-public-v1.10`; keep its asset URLs and cache name in sync on future releases. An updated worker waits for old tabs to close rather than replacing running code midway through a session.

A rollback after deploying a service worker must include a worker update at the same `sw.js` URL that deletes the Ready Together public caches and unregisters itself. Simply deleting the worker file or reverting only `index.html` may leave cached assets/worker registration on previously installed clients. Close/reopen and test both an existing install and a fresh browser after any rollback. Preserve household local storage; it is independent of the public-file cache.
