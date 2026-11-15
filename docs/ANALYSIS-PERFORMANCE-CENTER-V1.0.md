# Analysis Performance Center V1.0 (Football rich V3.7)

## Purpose
Extend the existing Performance view into an evidence-based analysis review center. It reuses the existing Match IDs and IndexedDB stores; it does not create a second match/result history.

## Existing data sources
- `matches`: stable Match IDs and fixture metadata.
- `analyses`: immutable pre-match analysis versions, 1X2 probabilities, recommendation, risk level, market snapshot, AH settlement probabilities and reasoning.
- `match_results`: verified final score and source/provenance, with revision history.
- `predictions` and `performance_records`: confirmed prediction snapshots and settled handicap outcome.
- `app_settings`: APC review labels, generated suggestions and user-approved guideline history.

## Views
1. Overview: counts, 1X2 accuracy, AH hit rate (push excluded from the denominator), Brier scores and pending results.
2. Analysis history: each analysis version linked to its Match ID and verified result; missed outcomes can be manually tagged with a review cause.
3. Strengths and weaknesses: breakdown by league, handicap line and risk level, with sample counts.
4. Development suggestions: deterministic rule-based suggestions only when a group has at least 8 evaluated examples and trails the relevant overall baseline by at least 10 percentage points. Suggestions require explicit user approval or rejection.
5. Data management: export a learning-data JSON snapshot; full backup/restore remains in Settings.

## Approval and learning policy
- Automatic means the app calculates metrics and drafts suggestions from local verified records. It does not modify analysis rules automatically.
- Review means each suggestion remains pending until the user approves or rejects it.
- Approval records a versioned guideline for Jeff to reference. It does not retrain GPT-6 or alter model weights.
- Error-cause labels are user-reviewed; score outcomes alone cannot establish why a prediction failed.
- Small samples are displayed with caution. Group suggestions require at least 8 examples; overall performance labels distinguish fewer than 30, 30–49 and at least 50 unique matches.

## Data safety
- No IndexedDB schema/version migration.
- No new object store; APC metadata is stored in the existing `app_settings` store.
- No Match ID, analysis, prediction or result is overwritten by APC.
- No database clearing/deletion is introduced.
- Existing full JSON backup/restore remains the recovery path.
