# Phase 4.0-B.7 — Real Browser Runtime Verification

## Goal
Validate the isolated V2 IndexedDB implementation in a real browser engine using native browser storage APIs, complementing B.6's fake-indexeddb integration acceptance.

## Automated Chromium coverage
- Exact 32-store database schema and open/verify behavior.
- Native IndexedDB CRUD and persistence after page reload.
- Multi-store transaction rollback with no partial writes.
- Unique compound-index collision and transaction abort.
- Atomic Match Revision plus append-only history and stale revision conflict.
- Append-only evidence mutation guard.
- Backup manifest/checksum validation.
- Restore staging isolation: staging a restore must not alter live V2 record counts.
- Recovery checkpoint persistence and retrieval linked to the backup checksum.
- Browser runtime error capture.

## Safety boundaries
- Uses a fresh headless Chromium context and isolated test IDs.
- Operates only on the separate `football-rich-local-v2` and its `-restore-staging` test database.
- Does not open, read, write, migrate, delete, or modify V1 data.
- Does not promote staged restore, alter production records, add UI, or connect V2 to the live application.
- Test databases are ephemeral to the browser context; no user browser profile is used.
- Football Time remains the sole source of official match results.

## Validation limits
CI Chromium is a real browser engine, but it is not a substitute for device-specific Android Chrome testing. The user must still confirm the Android browser runtime before any later production wiring or migration work. This phase does not authorize migration or production integration.
