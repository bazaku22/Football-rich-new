#!/usr/bin/env bash
set -euo pipefail

unzip -q -o football-rich-v1-test-candidate-0.5.0.zip -d .
cd football-rich-v1

npm install --no-audit --no-fund
sed -i 's/const first = -lowerMagnitude;/const first = lowerMagnitude === 0 ? 0 : -lowerMagnitude;/' src/domain/handicap.ts
npm run build

# GitHub Pages project sites are served beneath /Football-rich-new/.
find dist -type f \( -name '*.html' -o -name '*.js' -o -name '*.webmanifest' \) -print0 |
  xargs -0 sed -i \
    -e 's|"/|"/Football-rich-new/|g' \
    -e "s|'/|'/Football-rich-new/|g"
