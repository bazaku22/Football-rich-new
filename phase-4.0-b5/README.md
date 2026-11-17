# Phase 4.0-B.5 — Safe Data Intake & Coverage

Adds an isolated V2 intake foundation. It validates versioned envelopes, restricts importable stores, checks primary identity and required fields, classifies identical duplicates separately from same-key/different-content revisions, and calculates per-match data coverage without inventing missing evidence.

Safety: preview only; no writes to IndexedDB, no V1 access, no automatic result authoring, no migration, no UI, and no deployment. `MATCH_RESULT_UPDATE` remains read-only to Football rich and must carry Football Time provenance. Critical validation issues block commit. A later transaction/commit phase must consume only a user-confirmed preview.


Additional safeguard: `MATCH_RESULT_UPDATE` envelopes are accepted only when the envelope and each `result_references` record identify `FOOTBALL_TIME` as the source. Result updates cannot import match/team rows through this path; Football rich remains read-only for official results.
