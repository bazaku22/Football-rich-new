#!/usr/bin/env bash
set -euo pipefail

unzip -q -o football-rich-v1-test-candidate-0.5.0.zip -d .
cd football-rich-v1

npm install --no-audit --no-fund
sed -i 's/const first = -lowerMagnitude;/const first = lowerMagnitude === 0 ? 0 : -lowerMagnitude;/' src/domain/handicap.ts
npm run build

# The generated static PWA includes sw.js but the HTML entry point must register it.
node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const worker = path.join(dist, 'sw.js');
const entry = path.join(dist, 'index.html');
if (!fs.existsSync(worker)) throw new Error('PWA service worker dist/sw.js is missing');
if (!fs.existsSync(entry)) throw new Error('PWA entry point dist/index.html is missing');

let html = fs.readFileSync(entry, 'utf8');
if (!html.includes('navigator.serviceWorker.register')) {
  const registration = `<script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(new URL('sw.js', document.baseURI), {
          scope: new URL('./', document.baseURI).pathname
        }).catch(error => console.error('Football rich service worker registration failed:', error));
      });
    }
  </script>`;
  html = html.replace('</body>', registration + '</body>');
  fs.writeFileSync(entry, html);
}
console.log('PWA service worker registration injected into dist/index.html');
NODE

# GitHub Pages project sites are served beneath /Football-rich-new/.
find dist -type f \( -name '*.html' -o -name '*.js' -o -name '*.webmanifest' \) -print0 |
  xargs -0 sed -i \
    -e 's|"/|"/Football-rich-new/|g' \
    -e "s|'/|'/Football-rich-new/|g"
