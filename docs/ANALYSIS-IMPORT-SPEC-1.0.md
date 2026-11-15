# Football rich Analysis Import Format v1

**Status:** Draft v1.0 for implementation  
**Purpose:** Transfer a Jeff-authored pre-match football analysis into Football rich without manual re-entry.

## Files
- `.json` — canonical machine-readable import file.
- `.pdf` — optional human-readable report generated from the same JSON. PDF is never imported as data.

## Envelope
Every import must be a UTF-8 JSON object with:
- `schema_version`: exactly `1.0.0`
- `report_type`: exactly `football-rich-analysis`
- `report_id`: stable unique identifier for this report
- `created_at`: ISO-8601 timestamp including timezone
- `analysis_as_of`: ISO-8601 timestamp including timezone; the latest time the underlying information was checked
- `match`, `market`, `analysis`, `recommendation`, and `evidence`

## Decision model
The app's primary decision field is the chance of the selected favorite covering the stated Asian Handicap. Do not use odds value, Fair Odds, expected value, or EV as a pick criterion. Odds may be stored as a market snapshot only.

Keep these concepts separate:
- Match outcome probability (home win/draw/away win)
- Asian Handicap settlement probabilities (full win, half win, push, half loss, full loss)
- Overall handicap-cover probability

For quarter-goal lines, settlement outcomes must follow Asian Handicap split-stake rules. Do not treat a push/half-win as a full win.

## Missing or uncertain data
- Unknown values must be `null` or omitted, never guessed.
- If evidence is insufficient, `cover_probability` must be `null` and `probability_status` must be `insufficient_data`.
- The importer must not invent probabilities, source URLs, kickoff times, line prices, injuries, or lineups.
- Every source item should include its URL when available, publisher/name, and checked timestamp. If no verifiable URL is available, describe the limitation instead of fabricating a link.
- A provisional lean is not a confirmed bet recommendation.

## Safe import behavior
1. Validate JSON syntax, schema version, required fields, timestamp formats, ranges, and handicap line.
2. Display a preview before writing any records.
3. Check duplicate `report_id` and match identity (competition, kickoff, home team, away team).
4. Never silently overwrite an existing match, analysis, or prediction snapshot.
5. Offer explicit choices: skip duplicate, import as a new analysis version, or cancel. Do not merge conflicting prediction snapshots.
6. Only create a confirmed prediction after explicit user confirmation. An imported provisional recommendation remains provisional.
7. Save a provenance link between the imported report, match, analysis, and any prediction snapshot.
8. Never clear IndexedDB or change unrelated records during import.
9. Reject unknown future schema versions with a clear message; do not partially import them.
10. Validate before transaction; write related records atomically where the existing database layer supports it. Roll back on failure.

## Suggested mapping
- `match` → `matches`
- `analysis` + `evidence` → `analyses`, `research_records`, `source_evidence`
- `recommendation` + `market` → a draft prediction snapshot; confirmed only after user action
- retain the original JSON payload or a normalized provenance record so the imported analysis can be audited

## Import UX
The import screen should show:
- fixture, competition, kickoff and analysis freshness
- selected favorite and handicap line
- cover probability or an explicit insufficient-data warning
- risk level and concise reasoning
- market odds as reference only
- source list and any missing-data warnings
- duplicate status and the exact records that will be created

## Versioning
Changes that break field meaning or required structure require a new major schema version. Additive optional fields may be introduced within v1 only when older importers can safely ignore them.


## Probability calculation extension (V1.3-compatible)
Analysis reports should include `analysis.expected_goals` with numeric `home` and `away` expected-goal estimates (0–8) whenever the evidence supports a model estimate. The optional `basis` field briefly describes the evidence/model inputs. Football rich can derive missing 1X2 and Asian Handicap settlement distributions from these values using an independent Poisson score model. The selected side and handicap line come from `market.selected_team` and `market.handicap_line`.

The app defines handicap cover probability as **full-win probability + half-win probability**. Push probability is displayed separately and is not counted as a win. For quarter lines, the model splits the stake across the two adjacent half-goal lines before classifying the five settlement outcomes.

Expected goals are model estimates, not observed facts. They must be supported by researched team scoring/conceding rates, home/away performance, opponent strength and relevant team news. If those inputs cannot support a defensible estimate, leave expected goals and probability fields null, mark `probability_status` as `insufficient_data`, and set the recommendation to `pass` or `no_recommendation`. Never invent values merely to fill the UI.
