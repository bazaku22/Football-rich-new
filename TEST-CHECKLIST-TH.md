# Football rich V1 — Android acceptance checklist

Use only the clearly labelled synthetic fixture data during initial testing. The fixture is not live research or betting advice.

## Install and launch
- [ ] Open the GitHub Pages URL in Chrome on Android over HTTPS.
- [ ] Install/add Football rich to the home screen.
- [ ] Open from the installed icon and confirm all eight navigation areas render.
- [ ] Close and reopen; confirm records persist.

## Research and records
- [ ] Import `test-data/sample-backup.json` using merge mode.
- [ ] Confirm dashboard and match list show the synthetic sample matches.
- [ ] Review research notes, source evidence and sample team news.
- [ ] Add a new match and verify duplicate/invalid team input is rejected.

## Analysis and handicap
- [ ] Save a valid 1X2 analysis totalling 100%.
- [ ] Confirm incomplete or invalid probabilities are rejected.
- [ ] Test handicap lines -0.25, -0.75, -1.00 and -1.75.
- [ ] Verify full win, half win, push, half loss and full loss.
- [ ] Confirm settlement probabilities total 100% before Fair Odds and EV.
- [ ] Confirm a prediction and verify its snapshot appears in History.

## Results and backup
- [ ] Enter a result for a confirmed prediction and verify settlement/performance.
- [ ] Export JSON; test merge import and replace import only after reading the warning.
- [ ] Export CSV and inspect it in a spreadsheet.
- [ ] Test offline app-shell launch after first online load.

Do not clear browser storage before reporting a defect; it may destroy useful test evidence.
