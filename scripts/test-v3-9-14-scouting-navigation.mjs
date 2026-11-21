import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = 'football-rich-v1/dist';
const main = fs.readFileSync(root + '/main.js', 'utf8');
const css = fs.readFileSync(root + '/styles/main.css', 'utf8');
const html = fs.readFileSync(root + '/index.html', 'utf8');
const sw = fs.readFileSync(root + '/sw.js', 'utf8');
const version = JSON.parse(fs.readFileSync(root + '/app-version.json', 'utf8'));

assert.equal(version.version, '3.9.14');
assert.equal(version.previous_version, '3.9.13');
assert.equal(version.release, 'V3.9.14 — Young Talent Scouting UI restored; automatic PWA update');
execFileSync(process.execPath, ['--check', root + '/main.js'], { stdio: 'inherit' });

for (const marker of [
  "const APP_VERSION='3.9.14';",
  "const SCOUTING_SETTING_KEY = 'young_talent_watchlist_v1'",
  "['scouting', 'ดาวรุ่ง']",
  "scouting:'ดาวรุ่ง'",
  "else if (currentView === 'scouting') {",
  'sortScoutingPlayers(players)',
  'data-scout-open',
  'data-scout-tab',
  'scout-grade-form',
  'Nico Paz',
  'Mikey Moore',
  'Jonas Urbig',
  'Shea Lacey'
]) assert.ok(main.includes(marker), 'Missing Scouting runtime marker: ' + marker);

assert.ok(css.includes('grid-template-columns: repeat(5, minmax(0, 1fr)) !important;'));
assert.ok(css.includes('.scout-grid') && css.includes('.scout-card'));
assert.ok(html.includes('main.js?v=20261121-v3-9-14-scouting'));
assert.ok(html.includes('await registration.update()'));
assert.ok(html.includes("addEventListener('controllerchange'"));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v69'"));
assert.ok(sw.includes("'/Football-rich-new/domain/scouting-ranking.js'"));
assert.ok(sw.includes('self.skipWaiting()') && sw.includes('self.clients.claim()'));
assert.ok(!main.includes('indexedDB.deleteDatabase(') && !main.includes('objectStore.clear('));
console.log('PASS V3.9.14: final bundle contains complete Scouting UI, five-tab mobile navigation, explicit service-worker update/reload, cache v69, and no destructive IndexedDB operations.');
