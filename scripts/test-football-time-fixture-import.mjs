import fs from 'node:fs';
import assert from 'node:assert/strict';

const main=fs.readFileSync('dist/main.js','utf8');
const css=fs.readFileSync('dist/styles/main.css','utf8');

assert.ok(main.includes("currentView === 'football-time-import'"),'Football Time import route must be built');
assert.ok(main.includes('นำเข้าข้อมูลจาก Football Time'),'Tools Center entry must be visible');
assert.ok(main.includes('football-time-fixture-file')===false,'Use the canonical ft-fixture-file input id');
assert.ok(main.includes("root.querySelector('#ft-fixture-file')"),'File input must be scoped to the app root');
assert.ok(main.includes("payload.exported_by!=='football-time'"),'Reject files not exported by Football Time');
assert.ok(main.includes("payload.data_type!=='fixtures'"),'Reject non-fixture data envelopes');
assert.ok(main.includes("payload.scope.season_ids.includes('2026-2027')"),'Restrict import to season 2026/27');
for (const league of ['PL','PD','BL1','SA','FL1']) assert.ok(main.includes(league+':'), 'Missing approved league mapping: '+league);
for (const marker of [
  'FT-M-FOOTBALLDATA-',
  'sharedMatchId',
  'providerMatchId',
  'externalLeagueId',
  'externalSeasonId',
  'homeTeamExternalId',
  'awayTeamExternalId',
  'footballTimeSource',
  'footballTimeExportId',
  'buildFtPlan',
  'seenFixtures.some(x=>x.league_id===record.league_id',
  "db.transaction(['matches'],'readwrite')",
  "store.getAll()",
  "store.put({...m,...metadata})",
  "store.add({...base()",
  'confirm-ft-fixture-import',
  'ยังไม่มีการนำเข้าผลการแข่งขันจริง'
]) assert.ok(main.includes(marker),'Missing safe import behavior: '+marker);
assert.ok(main.includes('Local Match UUID')===false || main.includes('sharedMatchId'),'Shared ID mapping must remain additive');
assert.ok(css.includes('fixture-preview-row'));
assert.ok(!main.includes('payload.ftRecords'));
assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(!main.includes("objectStore('matches').clear("));
assert.ok(!main.includes("objectStore('matches').delete("));
console.log('Football Time fixture import checks passed: envelope validation, five-league scope, shared/local ID mapping, preview, duplicate/conflict guards, atomic matches-only transaction, and no destructive storage operations.');
