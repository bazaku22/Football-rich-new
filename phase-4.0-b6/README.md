# Phase 4.0-B.6 — Integration & Acceptance

## Goal
Verify that the isolated V2 foundation behaves as one coherent data layer before any production wiring or migration is considered.

## Integrated acceptance coverage
- Open and verify the exact 32-store V2 schema.
- Exercise repositories and foreign-reference integrity checks.
- Create a match revision atomically and verify optimistic concurrency plus append-only history.
- Validate B.5 intake envelopes, duplicate classification, version-required conflicts, and coverage readiness without inferring missing data.
- Create and checksum a consistent backup, validate it, and stage a restore without replacing live V2 records.
- Persist and retrieve a recovery checkpoint linked to the backup checksum.

## Safety boundaries
- Automated acceptance tests only; no UI or application feature wiring.
- No V1 reads/writes, migration, live user data, restore promotion, deletion, or production database mutation.
- Intake remains preview-only; this phase does not add a commit/import action.
- Football Time remains the only source of official match results.
- No deploy. Merge and deployment remain separate approvals.

## Validation
The integration acceptance test is added to build-from-archive.sh after B.1–B.5 checks and runs against the generated isolated workspace with fake-indexeddb. It does not establish real Android browser storage behavior; that requires a later manual device test.
