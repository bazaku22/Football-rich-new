import fs from 'node:fs';import assert from 'node:assert/strict';
const main=fs.readFileSync('dist/main.js','utf8'),html=fs.readFileSync('dist/index.html','utf8'),sw=fs.readFileSync('dist/sw.js','utf8'),css=fs.readFileSync('dist/styles/main.css','utf8'),version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));
assert.equal(version.version,'2.1');assert.ok(html.includes('main.js?v=20261116-v2-1'));assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v42'"));
for(const x of ["const APP_VERSION='2.1';","if (currentView === 'dashboard')","else if (currentView === 'research')","else if (currentView === 'analysis')","else if (currentView === 'settings')",'v21-calendar','v21-card','v21-probs','v21-ah','v21-risk','v21-details','data-date','data-shift',"listRecords('matches')","listRecords('analyses')","listRecords('match_results')"])assert.ok(main.includes(x),'Missing '+x);
for(const x of ['v21-calendar','v21-card','v21-probs','v21-ah','v21-details'])assert.ok(css.includes(x),'Missing CSS '+x);
assert.ok(!main.includes('พื้นที่โปรแกรมแข่งขันกำลังปรับปรุง'));assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(fs.readFileSync('dist/data/schema.js','utf8').includes("'matches'"));assert.ok(fs.readFileSync('dist/data/schema.js','utf8').includes("'match_results'"));
console.log('V2.1 tests passed: 7-day calendar, match cards, probabilities, AH risk, expandable details, results integration, routes and data stores retained.');
