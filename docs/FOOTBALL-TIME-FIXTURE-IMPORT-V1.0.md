# Football Time Fixture Import v1.0 — Football rich

**Status:** Draft runtime implementation for review. The import is local-only and user-triggered.

## Scope

This importer accepts the Football Time ecosystem envelope with:

- `schema_version: 1.0.0`
- `exported_by: football-time`
- `data_type: fixtures`
- Phase 1 league IDs only: PL, PD, BL1, SA, FL1
- Season: `2026-2027`
- One to 2,500 fixture records

It does not accept result, odds, player, team-statistics, or analysis payloads. It makes no network/API calls.

## Identity and matching

Football rich keeps the existing local IndexedDB Match UUID as the primary key.

Each imported fixture stores additive FT mapping/provenance fields on the local match:

- `sharedMatchId`
- `provider` and `providerMatchId`
- `externalLeagueId`, `externalSeasonId`
- `homeTeamExternalId`, `awayTeamExternalId`
- `footballTimeStatus`, `footballTimeSource`
- `footballTimeRecordUpdatedAt`, `footballTimeExportId`, `footballTimeImportedAt`

Matching order:

1. Exact existing `sharedMatchId`.
2. Exact provider + provider match ID mapping, followed by team, league, and kickoff consistency checks.
3. Unique local match with the same normalized league, home/away team labels, and kickoff within two minutes.
4. If no candidate exists, create a new local UUID and attach the FT shared ID.
5. If a match is ambiguous, duplicated, or conflicts in ID/team/league/kickoff, block the entire import. No fuzzy guessing or merge is performed.

## Import behavior

- Validate the complete envelope and every record before preview.
- Show total records, new local matches, matched local matches, and conflicts.
- Show up to 12 fixture examples in the preview.
- Re-importing the same export resolves through the same shared IDs and does not create duplicate local matches.
- Recheck the full mapping inside one IndexedDB read/write transaction immediately before writing.
- Only the existing `matches` object store is written.
- A conflict or transaction failure aborts the entire batch.
- Existing local UUIDs, analyses, predictions, results, performance records, and all other stores are preserved.

## Results are not imported here

Fixture status and source metadata are stored as FT metadata. This importer does not import scores, mark results as verified, settle predictions, or modify the existing result importer. Result import is a separate follow-up after FT result revision export and the read-only result importer are implemented and tested.

## Manual workflow

1. In Football Time, export the approved 5-league fixtures JSON.
2. In Football rich, open **เครื่องมือ → นำเข้าข้อมูลจาก Football Time**.
3. Select the JSON file and review the preview.
4. Resolve any conflict in the source/local records before retrying.
5. Confirm the batch only when the preview has zero conflicts.

The app remains offline/local-first; the file transfer is performed by the user.
