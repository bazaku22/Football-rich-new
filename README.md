# Football rich — AI Football Analysis & Intelligence

Thai-first, local-first Android-focused PWA for the user's private football analysis workflow.

## V1.1 workflow candidate
- Six primary areas: Dashboard, Matches, Analysis Import, Predictions, Results and Performance.
- Import Jeff-authored JSON reports and preview separate 1X2 and Asian Handicap settlement probabilities.
- Explicitly confirm an eligible recommendation before creating a prediction snapshot.
- Record the final score once per match and settle all confirmed predictions for that match.
- Review handicap outcomes, 1X2/handicap Brier scores when probability snapshots exist, and sample-size-aware performance summaries.
- Keep the Black & Gold identity and crown-and-trophy emblem.

## Data and privacy
- IndexedDB on the device remains the primary data store. V1.1 does not upgrade or clear the existing database.
- JSON backup/restore and CSV export remain available in Settings.
- No backend, cloud database, football data API or AI API.
- Research and analysis are performed externally with Jeff; the user imports the resulting JSON report.
- The public repository contains app source/build artifacts only. Never commit API keys, passwords, tokens, personal records or private research.

## Build locally
Requirements: Node.js 20+ and Python 3.

```bash
bash build-from-archive.sh
cd football-rich-v1
npm run dev
```

## Build and tests
```bash
cd football-rich-v1
npm run build
npm run test:smoke
npm test
```

The repeatable build applies the V1.1 workflow patch to the generated PWA bundle before deployment.

## Deployment
GitHub Pages: https://bazaku22.github.io/Football-rich-new/

The app stores records in the current browser profile on the device. Browser storage can be cleared, so export a JSON backup before updating and keep it outside the browser.

## Important
- Synthetic sample records are for testing only and are not betting advice.
- Odds are stored as a market snapshot only; Fair Odds and EV are not selection criteria.
- Performance summaries are sample-size-aware. A small sample must not be treated as proof of model accuracy.
- Android installation, offline behavior, and backup/restore must be verified on the target device before relying on the app.
- This is a test-candidate release until Android acceptance testing is completed.

## Analysis report format
JSON is the canonical machine-readable format; PDF is a human-readable companion only.
- [Format specification](docs/ANALYSIS-IMPORT-SPEC-1.0.md)
- [JSON Schema](schemas/football-rich-analysis-v1.schema.json)
- [First sample report](samples/analysis-match-001.json)
