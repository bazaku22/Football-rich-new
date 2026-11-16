# Football Time → Football rich Import Specification v1.0

**Status:** Architecture specification only. No runtime code or local IndexedDB records are changed by this document.

## 1. Ownership

- Football Time (FT) is the sole source of truth for official fixtures, shared match identity, final scores, result revisions, and source provenance.
- Football rich is the local analysis and model-evaluation client. It must not author, correct, or independently maintain official match results.
- Transfer remains user-controlled JSON export/import. Football rich must not call football-data, odds, or AI APIs.

## 2. Fixture envelope

Football rich accepts the FT exchange envelope when:

- `schema_version` is `1.0.0`
- `exported_by` is `football-time`
- `data_type` is `fixtures`
- `scope.league_ids` contains only the approved Phase 1 leagues: PL, PD, BL1, SA, FL1
- `scope.season_ids` contains the declared season, initially `2026-2027`

Each fixture contains the FT shared Match ID, provider Match ID, league/season, existing FT team IDs, team labels, UTC kickoff, status, source, and record update timestamp.

## 3. Local Match ID preservation and mapping

Football rich's existing local Match UUID remains its IndexedDB primary key and is never replaced by the FT shared Match ID.

Each local match may store additive identity fields:

- `sharedMatchId`: FT shared ID, e.g. `FT-M-FOOTBALLDATA-560643`
- `providerMatchId`: original FT provider ID as a string
- `provider`: `football-data`
- `externalLeagueId`, `externalSeasonId`
- `homeTeamExternalId`, `awayTeamExternalId`

Matching order:

1. If exactly one local match already has the same `sharedMatchId`, update its FT metadata and preserve its local UUID.
2. If no shared ID is mapped, find candidates using the existing exact competition/team identity and kickoff tolerance. A candidate is accepted only if exactly one local match matches.
3. If exactly one candidate matches, attach the shared ID to that local record; do not change its UUID or its analysis/prediction relationships.
4. If no candidate matches, create a new local match with a new local UUID and the FT shared ID.
5. If multiple candidates match, if a shared ID is already assigned to a different local UUID, or if provider/team identity conflicts, flag the record for manual review. Do not guess, merge, or create a duplicate.

A repeated fixture export is idempotent: it updates only FT-owned fixture metadata and does not create a second local match or duplicate analysis.

## 4. Result envelope and read-only result ownership

Result import is enabled only when FT supplies:

- `data_type: "match_results"`
- the exact FT `match_id` already mapped to one local match
- `status: "FINISHED"`
- non-negative integer home/away scores
- positive `result_revision`
- timezone-aware `updated_at`
- `source.provider` and `source.verified_at`

The result must be linked by `sharedMatchId`. Name-only matching is not allowed for results.

The importer must reject results when the shared ID is unknown, maps to more than one local record, has conflicting provider/team identity, or lacks revision/provenance fields.

## 5. Revision and idempotency rules

For each shared Match ID, Football rich stores the latest accepted FT revision and preserves every imported revision in the existing result record's revision history.

| Incoming revision | Incoming score | Required behavior |
|---|---|---|
| Lower than stored | Any | Reject as stale; do not change current result |
| Equal to stored | Same score and provenance | Idempotent no-op |
| Equal to stored | Different score or provenance | Conflict; block import and require FT correction/re-export |
| Higher than stored | Same or corrected score | Accept as new FT revision; append prior result/settlement to history |

A higher revision must not delete the previous result, prediction, or performance history. The imported source and revision remain visible in the match detail and performance audit.

## 6. Prediction and performance evaluation

- First accepted FT result settles eligible predictions using the verified final score.
- A higher FT revision re-evaluates the affected prediction settlement.
- Previous settlement, prior result score, source, revision, and performance calculation are appended to revision history before recalculation.
- The result update, match status, prediction settlement, and performance history changes must occur in one IndexedDB read/write transaction.
- If any match in a batch conflicts, the preview must show the conflict and the transaction must not partially apply the batch.

## 7. User workflow

1. Export a fixtures JSON file from Football Time.
2. In Football rich, open Tools → Import from Football Time.
3. Select the JSON file and review new, matched, updated, skipped, and ambiguous records.
4. Confirm once; the app performs an atomic fixture import.
5. After FT has published result revisions, select the result JSON file and review the result preview.
6. Confirm the result import; Football rich stores it as FT-owned, read-only result data.

The result screen must not provide a manual score editor or manual correction control for FT-managed matches. Legacy result records from older app versions remain visible and preserved, but must not be silently converted into FT-verified results.

## 8. IndexedDB and migration safety

- Keep the existing local UUIDs and all foreign-key relationships.
- Prefer additive fields on existing stores (`matches`, `results`, `predictions`, `performance_records`) rather than a new store or database version bump.
- Do not clear stores, reset the database, or delete historical records.
- Preview the complete batch before writing.
- Revalidate mappings immediately before the transaction.
- Export a backup before any future migration that changes the result importer.
- No backend, Supabase, API, or network dependency is introduced.

## 9. Acceptance tests

1. Re-importing the same fixture envelope does not duplicate local matches.
2. Existing local UUIDs remain unchanged when a shared ID is attached.
3. New FT fixtures receive a new local UUID and the exact shared ID.
4. Ambiguous local candidates are flagged and not merged.
5. A shared ID already mapped to another UUID is a hard conflict.
6. Team/provider identity mismatch is a hard conflict.
7. A result with an unknown shared ID is rejected.
8. A result without a positive revision or provenance is rejected.
9. A lower result revision is rejected as stale.
10. Equal revision and identical score is a no-op.
11. Equal revision and different score is a conflict.
12. Higher revision updates the latest result and appends the previous result.
13. Higher revision preserves prior prediction settlement and performance history.
14. A batch with one conflict does not partially write.
15. A repeated result export does not duplicate revision history.
16. Result import never creates a new fixture.
17. FT-managed results cannot be edited manually in Football rich.
18. Legacy local result records remain intact and are not falsely labelled FT-verified.
19. Import works offline and performs no football/odds/AI API calls.
20. Failed validation or transaction leaves all existing stores unchanged.

## 10. Relationship to legacy manual Result Import

The existing manual Result Import specification describes behavior from earlier Football rich versions. It is retained as historical documentation only. The FT ecosystem workflow supersedes it for official results once the runtime importer is implemented and accepted. Until then, do not disable the existing runtime flow or migrate user data as part of this document-only change.
