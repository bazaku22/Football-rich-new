# Football rich Analysis Engine V3.0 — Implementation & QA Specification

## Purpose
V3.0 changes the analysis method while preserving the local-first app, match history, prediction snapshots, and V1.0.0 import envelope. No paid APIs, backend, or remote football data APIs are introduced.

## 1. Independent output dimensions
- 1X2: home win / draw / away win, sum = 1.
- AH: full win / half win / push / half loss / full loss, sum = 1.
- AH cover: full win + half win only.
- Data confidence: evidence quality/coverage, 0–100.
- Risk score: uncertainty, 0–100; never derived as 100 minus cover probability.

## 2. Six core evidence groups and initial weights
| Group | Initial weight |
|---|---:|
| Last five matches + opponent strength | 20% |
| H2H (time-decayed, low influence) | 5% |
| Key-player availability and impact | 15% |
| Injuries/suspensions | 15% |
| Home/away form | 20% |
| Scoring/conceding rates | 25% |
| Total | 100% |

Season-level baselines stabilize small samples. Recent form must be opponent-adjusted. H2H is capped at low influence and discounted for stale or non-comparable squads. Avoid double-counting player absences. Tactical, schedule, motivation, venue/weather context may be documented as bounded adjustments, never unsupported facts.

These are V3.0 starting weights, not empirically validated coefficients. Retain them as explicit defaults until enough historical data supports re-estimation.

## 3. Probability engine
- Estimate home and away expected goals using verified attack/defense rates, home-away splits, opponent quality, recent form and verified team news.
- Build a score matrix using the current Independent Poisson model.
- Derive 1X2 and all AH settlement probabilities from the same score matrix.
- Preserve probability distributions separately and validate sums within 0.005 before import.
- Do not force a numeric forecast when baseline evidence is insufficient.
- Calibration is reported, not silently applied. Track Brier Score independently for 1X2 and AH. No automatic recalibration from small samples.

## 4. Two-sided AH market comparison
- Enumerate only handicap lines actually verified in the market, both selected teams, positive and negative lines, quarter increments, within -4.00 to +4.00.
- handicap_line is applied to selected_team: negative means the selected team gives a handicap; positive means it receives one. If no verified line exists, selected_team=none and handicap_line=null.
- Calculate five settlement outcomes for every candidate. cover_probability = full_win + half_win.
- Main recommendation ranks positive-settlement probability first, then full-win probability, lower loss probability, lower risk score, and evidence/price freshness as tie-breakers.
- Decimal odds and source/time are market snapshots only. Do not calculate EV, Fair Odds, Value Bet, or profit simulations.
- If no verified candidate or market line exists, PASS or NO RECOMMENDATION; use selected_team=none and handicap_line=null rather than inventing a market line.

## 5. Risk score (initial bands)
Each component is a 0–100 risk score:
| Component | Weight |
|---|---:|
| Data incompleteness | 30% |
| Form instability | 25% |
| Disagreement between factors | 20% |
| Lineup uncertainty | 15% |
| Market volatility | 10% |

risk_score = 0.30*data_completeness + 0.25*form_instability + 0.20*factor_disagreement + 0.15*lineup_uncertainty + 0.10*market_volatility

Initial bands: LOW 0–29, MEDIUM 30–59, HIGH 60–100. These are provisional operating thresholds and must be evaluated against historical outcomes before being described as validated. Missing critical evidence can make risk undetermined.

Data confidence is separate and describes source coverage/reliability, not forecast accuracy.

## 6. Backward compatibility and data safety
- Keep schema_version 1.0.0 and existing required fields.
- Add optional V3.0 properties: risk_score, data_confidence, risk_components, factor_assessments, model_calibration, candidate_handicaps.
- Expand handicap validation to quarter increments from -4.00 to +4.00.
- Existing negative/zero handicap imports remain valid.
- No IndexedDB deletion, objectStore.clear, database reset, history rewrite, or overwrite of existing prediction snapshots.
- Preserve old reports and source payloads unchanged.

## 7. QA acceptance
- Valid negative, zero and positive AH lines import successfully.
- Invalid line outside -4 to +4 or not in 0.25 increments is rejected.
- Quarter-line settlement and five-outcome distribution sum correctly.
- Risk component weighted sum matches risk_score within rounding tolerance.
- Risk score, confidence, and probability remain distinct in UI.
- Old V1 imports still import without V3 optional fields.
- Existing Match Center, day grouping, detail dialogs, flags/crests, result checks and historical records remain unchanged.
- Run build, smoke tests, unit tests and V3 regression tests before deployment.
