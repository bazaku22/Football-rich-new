# Football rich V1.1 — Android acceptance checklist

**Before updating:** export a JSON backup from Settings and save it outside the browser. Do not clear Chrome/site storage or uninstall the existing PWA during the test.

Use only clearly labelled synthetic fixture data during initial testing. The fixture is not live research or betting advice.

## Launch and navigation
- [ ] Open https://bazaku22.github.io/Football-rich-new/ in Chrome on Android.
- [ ] Refresh the existing installed PWA and confirm it opens without the startup error.
- [ ] Confirm the six main areas: Dashboard, Matches, Analysis Import, Predictions, Results and Performance.
- [ ] Confirm the mobile navigation is fixed at the bottom and does not cover page content.
- [ ] Open Settings from the Dashboard or settings icon.

## Analysis import
- [ ] Import a valid Football rich Analysis JSON v1.0.0 file.
- [ ] Preview fixture, competition, analysis timestamp, selected favorite, handicap line and odds snapshot.
- [ ] Confirm 1X2 probabilities are displayed separately from the five Asian Handicap settlement probabilities.
- [ ] Confirm missing probabilities remain visibly unavailable; never display a fabricated 0%.
- [ ] Confirm duplicate report IDs are blocked and an existing match gets a new analysis version rather than silent overwrite.
- [ ] Confirm importing a report does not automatically create a confirmed prediction.

## Predictions
- [ ] Confirm a recommendation only when status is recommended, team/line agree, handicap probabilities are complete and odds are valid.
- [ ] Confirm provisional, pass, no-recommendation or insufficient-data reports cannot be confirmed.
- [ ] Confirm the explicit confirmation step creates one immutable prediction snapshot.
- [ ] Confirm the same analysis cannot be confirmed twice.
- [ ] Confirm no Fair Odds or EV is used as a pick-selection criterion.

## Results and settlement
- [ ] Enter a final score for a match with confirmed predictions.
- [ ] Confirm all confirmed predictions for that match are settled against the same final score.
- [ ] Test full win, half win, push, half loss and full loss using suitable synthetic cases.
- [ ] Confirm a match result cannot be silently overwritten or entered twice.
- [ ] Confirm prediction status and match status update after settlement.

## Performance
- [ ] Confirm settled count and full/half-win counts match the saved results.
- [ ] Confirm handicap Brier Score uses saved five-way settlement probabilities.
- [ ] Confirm 1X2 Brier Score appears only where a 1X2 snapshot and final score exist.
- [ ] Confirm the sample-size label uses unique matches: under 30, 30–49 and 50+.
- [ ] Confirm league/handicap-line breakdowns use recorded results only.

## Data preservation and regression
- [ ] Confirm existing matches, analyses, predictions and results remain visible after the update.
- [ ] Export JSON backup and verify the file downloads.
- [ ] Test backup merge only with a known test file. Do not use Replace during initial acceptance.
- [ ] Confirm CSV export remains available.
- [ ] Test offline app-shell launch after one successful online load.
- [ ] Report any defect without clearing browser storage; it may destroy useful test evidence.

