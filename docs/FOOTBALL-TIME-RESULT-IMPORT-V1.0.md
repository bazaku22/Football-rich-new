# Football Time Result Import v1.0 — Football rich

**Status:** Draft implementation for review. The importer is local-only, user-triggered, and read-only with respect to official results.

## Scope

Accepts Football Time exchange envelopes with:
- `schema_version: 1.0.0`
- `exported_by: football-time`
- `data_type: match_results`
- Phase 1 league IDs PL, PD, BL1, SA, FL1
- Season `2026-2027`
- Finished scores, positive result revisions, source provenance, and complete `revision_history`

## Identity and validation

- A result must map to exactly one existing local match through its previously imported `sharedMatchId`.
- No name-based or kickoff-based result matching is allowed.
- Provider Match ID and any known league/season mapping must agree.
- Every revision must be sequential from 1, with non-negative integer scores, FINISHED status, timezone-aware timestamps, and source provenance.
- The latest history entry must agree with the current score and revision.

## Revision behavior

- Older revisions are rejected as stale.
- Equal revision with identical score and history is an idempotent no-op.
- Equal revision with different content is a conflict.
- A newer revision is accepted only when its full history begins with the exact history already imported locally.
- Every accepted record stores the complete FT result snapshot and history on the existing local Match record.

## Storage safety

- Writes only to the existing `matches` object store, in one transaction.
- Adds `footballTimeResult`, `footballTimeResultHistory`, source/export timestamps, and a read-only marker.
- Does not write to or replace the legacy `match_results`, predictions, analyses, or performance stores.
- Does not create fixtures, replace local Match UUIDs, or modify manual results.
- No database version upgrade, API, backend, or paid service is introduced.

## Evaluation boundary

This phase imports and preserves official FT result revisions. It deliberately marks evaluation as pending rather than silently changing existing prediction settlement or performance history. A separate reviewed step will connect the FT read-only snapshot to performance evaluation after the current result-store and settlement behavior has been verified.

## Manual acceptance

1. Import Fixtures from Football Time first.
2. Open Tools → Import Results from Football Time.
3. Select the FT Match Results JSON and inspect new, updated, unchanged, and conflicting records.
4. Confirm only when there are zero conflicts.
5. Re-import the same file and verify it is a no-op.
6. Import a newer revision and verify earlier revisions remain in the stored history.
7. Confirm legacy Result Import data and predictions remain unchanged.
