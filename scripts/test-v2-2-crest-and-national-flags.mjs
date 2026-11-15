import fs from 'node:fs';import assert from 'node:assert/strict';
const main=fs.readFileSync('dist/main.js','utf8'),css=fs.readFileSync('dist/styles/main.css','utf8'),html=fs.readFileSync('dist/index.html','utf8'),sw=fs.readFileSync('dist/sw.js','utf8'),version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));
assert.equal(version.version,'2.2');assert.ok(html.includes('main.js?v=20261116-v2-2'));assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v43'"));
for(const marker of ["const APP_VERSION='2.2';",'const nationalFlags =','const flagFor =','v22-flag','v22-crest','england:',"japan:'🇯🇵'","brazil:'🇧🇷'","southkorea:'🇰🇷'","thailand:'🇹🇭'"])assert.ok(main.includes(marker),'Missing '+marker);
for(const marker of ['mix-blend-mode:multiply','v22-flag','v22-crest'])assert.ok(css.includes(marker),'Missing CSS '+marker);
assert.ok(main.includes('u(?:17|18|19|20|21|23)'));assert.ok(!main.includes('indexedDB.deleteDatabase('));assert.ok(!main.includes('objectStore.clear('));
console.log('V2.2 tests passed: crest background blending, country flags, youth-team aliases, cache busting and data preservation.');
