# Football rich V3.4 — Combined Fixture + Analysis Import

## Purpose
V3.4 replaces the separate Fixture Import and Analysis Import tools with one workflow. Jeff prepares **one JSON batch file**; the app creates Match IDs where needed and attaches every analysis report during the same import.

## File format
The outer JSON object uses:

- `schema_version`: `1.0.0`
- `report_type`: `football-rich-analysis-batch`
- `batch_id`: unique batch identifier
- `created_at`: ISO-8601 timestamp
- `reports`: 1–100 complete Football rich Analysis v1.0.0 report objects

Each report in `reports` must conform to [the existing analysis import specification](ANALYSIS-IMPORT-SPEC-1.0.md), including `report_id`, `match`, `market`, `analysis`, `recommendation`, and `evidence`.

The `match` object in each report is also the fixture definition. It must include a valid `competition`, `home_team`, `away_team`, and `kickoff_at`. The app uses these fields to identify or create the fixture; Jeff does not generate Match IDs.

## Matching and Match ID behavior
1. The app searches for an existing match with the same competition, home team, away team, and kickoff time (within two minutes).
2. If exactly one match is found, the app reuses its Match ID and appends a new analysis version.
3. If no match is found, the app creates a new Match record and Match ID, then attaches the analysis to it.
4. If more than one match matches, or a report ID is already associated with a different Match ID, the entire import is rejected for review.
5. Duplicate fixtures or duplicate report IDs inside the same batch are rejected.

## Safety and data preservation
- The app validates all reports and match mappings before saving.
- The confirmation step rechecks fixture identity and report ownership to avoid concurrent duplicate creation.
- New Match records, analysis records, research records, and source evidence are written in one IndexedDB read/write transaction. A failed transaction does not partially save the batch.
- Existing analysis versions remain in history; an existing report ID may append a new version only to the same Match ID.
- Existing match records, Match IDs, results, result revision history, and predictions are not deleted or cleared.
- Result Import remains a separate tool for use after a match finishes.

## User workflow
1. Open **เครื่องมือ**.
2. Choose **นำเข้าโปรแกรมพร้อมบทวิเคราะห์**.
3. Select the single combined JSON file.
4. Review the fixture and analysis preview.
5. Confirm once to import the entire batch.

The former standalone Fixture Import and Analysis Import cards are no longer shown in Tools Center.
