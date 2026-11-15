import fs from 'node:fs';
import assert from 'node:assert/strict';

const main=fs.readFileSync('dist/main.js','utf8');
const html=fs.readFileSync('dist/index.html','utf8');
const sw=fs.readFileSync('dist/sw.js','utf8');
const version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));
const database=fs.readFileSync('dist/data/database.js','utf8');
const schema=fs.readFileSync('dist/data/schema.js','utf8');

assert.equal(version.version,'1.33');
assert.ok(html.includes('main.js?v=20261116-v1-33'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v41'"));
assert.ok(main.includes("if (currentView === 'dashboard')"));
assert.ok(main.includes("else if (currentView === 'research')"));
assert.ok(main.includes("else if (currentView === 'analysis')"));
assert.ok(main.includes('พื้นที่โปรแกรมแข่งขันกำลังปรับปรุง'));

for(const marker of ['data-select-match','data-open-match-detail','mc-detail-modal','result-import-file','match-form','renderMatchesByDay','mc-day-section','mc-calendar-head','mc-status-upcoming','mc-status-live','mc-status-finished','knownClubCrests']) {
  assert.ok(!main.includes(marker),'Match Center UI marker must be absent: '+marker);
}
assert.ok(!main.includes('data-go="matches"'));
assert.ok(!main.includes("root.querySelectorAll('[data-select-match]')"));
assert.ok(!main.includes('window.__footballRichOpenMatchDetail'));
assert.ok(!main.includes('กำลังโหลดรายละเอียดแมตช์'));

// Data structure and backup support are still present; the UI patch does not clear or delete them.
assert.ok(schema.includes("'matches'"));
assert.ok(schema.includes("'match_results'"));
assert.ok(database.includes('backup.stores.matches'));
assert.ok(database.includes('match_results'));
assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(!main.includes('objectStore.clear('));
console.log('V1.33 tests passed: Dashboard Match Center UI and modal removed; research/analysis/settings/performance remain; match/result stores and backup support preserved.');
