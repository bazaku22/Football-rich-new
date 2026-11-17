# Android Chrome V2 Device Test

This is a standalone, opt-in browser compatibility smoke test for Android Chrome.

## Safety
- Uses only `football-rich-v2-android-device-test` and `football-rich-v2-android-restore-staging`.
- Synthetic records only.
- Does not open, read, write, migrate, clear, or delete V1 or the live app database `football-rich-local-v2`.
- Does not connect V2 to the app, promote a restore, or alter production records.
- The user can remove only these two test databases using the page's cleanup action.

## What it checks
- IndexedDB opens and creates 32 isolated object stores.
- Basic CRUD using synthetic records.
- Native transaction abort/rollback.
- Unique index duplicate rejection.
- Web Crypto SHA-256 availability for backup checksum workflows.
- Separate restore-staging database does not replace the primary test database.
- Persistence after a page reload.

## Important limitation
This page is a device/browser compatibility smoke test, not a second execution of the V2 TypeScript repositories or the full backup/restore implementation. The CI Chromium test remains the implementation-level verification. This page deliberately does not import or wire V2 modules into the live app.

Open `https://bazaku22.github.io/Football-rich-new/v2-device-test/` on Android Chrome. Tap **เริ่มทดสอบ**, reload the page, then tap **ทดสอบหลังรีโหลด**. Share the PASS/FAIL results. Cleanup is optional and removes only the two named test databases.
