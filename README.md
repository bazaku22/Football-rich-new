# Football rich — AI Football Analysis & Intelligence

Thai-first, private-use, local-first Android-focused PWA for football research records, favorite-side Asian Handicap calculations, prediction snapshots and simulated performance tracking.

## V1 scope
- Dashboard, matches, research/evidence, analysis, Asian Handicap intelligence, prediction history, performance and settings.
- IndexedDB local storage; JSON backup/restore and CSV export.
- No backend, cloud database, football data API or AI API.
- Research is performed externally and manually saved in the app.
- Synthetic sample records are for testing only and are not betting advice.

## Run locally
Requirements: Node.js 20+.

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

## Deployment
This repository is the public GitHub Pages deployment source. The app stores records in the current browser profile on the device. Browser storage can be cleared, so export JSON backups regularly and keep them outside the browser.

## Important
- The repository is public. Do not commit API keys, passwords, tokens, personal records or private research.
- Sample fixture data is fictional.
- Android installation, offline behavior and backup/restore must be verified on the target device before relying on the app.
- This is a test-candidate release, not a claim of completed real-device acceptance testing.


## Analysis report import (in progress)
The canonical interchange format is JSON; PDF is a human-readable companion only.
- Format specification: [docs/ANALYSIS-IMPORT-SPEC-1.0.md](docs/ANALYSIS-IMPORT-SPEC-1.0.md)
- JSON Schema: [schemas/football-rich-analysis-v1.schema.json](schemas/football-rich-analysis-v1.schema.json)
- First sample: [samples/analysis-match-001.json](samples/analysis-match-001.json)

The in-app import screen is not yet released. Do not treat the sample as a confirmed betting recommendation: it deliberately leaves cover probability unset where verified evidence is insufficient.
