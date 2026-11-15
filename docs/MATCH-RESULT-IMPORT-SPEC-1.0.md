# Football rich Result Import Format v1.0

**Status:** Implemented in Match Center V1.2  
**Purpose:** Import verified final scores and optional goal events into the local Football rich app.

## Envelope

The UTF-8 JSON file must contain:
- `schema_version`: exactly `1.0.0`
- `report_type`: exactly `football-rich-result`
- `result_id`: stable unique ID for this import batch (at least 8 characters)
- `created_at`: ISO-8601 timestamp including timezone
- `verified_at`: ISO-8601 timestamp for when the final result was verified
- `source`: name/description of the source used to verify the result
- `matches`: 1–100 match results

## Match linking

Each match item must contain at least one of:
- `match_id`: exact local Match ID displayed on its Match Center card; preferred.
- `analysis_report_id`: exact `report_id` from an imported Analysis JSON report.

Optional `home_team` and `away_team` labels are checked against the local fixture to prevent linking a score to the wrong match.

## Result and events

- `home_goals` and `away_goals` must be non-negative integers.
- `events` is optional. Each event currently represents a goal and may include `minute`, `scorer`, and `assist`.
- `team` must be `home` or `away`.
- Scorer and assist details should be included only when verified. Omit unavailable details; never invent them.
- Events may be incomplete. The importer does not assume every goal event or assist is available.

## Safe import and correction behavior

1. The app validates the complete JSON file and resolves every match before writing.
2. A preview lists every match, score, Match ID, and whether an existing result is present.
3. A repeated `result_id` is rejected.
4. If any match already has a result, the user must explicitly tick the correction confirmation.
5. Corrections use the same result record ID and append the prior score, source, verification time, and events to `revisionHistory`; the prior result is not silently deleted.
6. Match status changes to `FINISHED` only after a successful result import.
7. Predictions for that match are settled from the final score. Existing performance records are revised with their previous settlement and profit retained in their own revision history.
8. The result, match status, prediction statuses, and performance updates are written in one IndexedDB transaction.
9. The app uses the existing 10 IndexedDB stores and DB version 1. No database migration or new store is required.

For a correction, create a new `result_id`; do not reuse the ID of a previously imported batch.

## Example

```json
{
  "schema_version": "1.0.0",
  "report_type": "football-rich-result",
  "result_id": "fr-result-example-20261115-001",
  "created_at": "2026-11-15T20:00:00+07:00",
  "verified_at": "2026-11-15T21:55:00+07:00",
  "source": "Verified official competition match report",
  "matches": [
    {
      "match_id": "REPLACE_WITH_MATCH_ID_FROM_APP",
      "home_team": "Home FC",
      "away_team": "Away FC",
      "home_goals": 2,
      "away_goals": 1,
      "events": [
        {
          "type": "goal",
          "minute": "34",
          "team": "home",
          "scorer": "Verified scorer name",
          "assist": "Verified assister name"
        },
        {
          "type": "goal",
          "minute": "78",
          "team": "away",
          "scorer": "Verified scorer name"
        }
      ]
    }
  ]
}
```

The example is illustrative only. Replace the Match ID, teams, score, timestamps, source, and event details with verified values. The app also offers a downloadable template prefilled with the user's current Match IDs.
