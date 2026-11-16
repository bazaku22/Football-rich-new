import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root=fs.existsSync('football-rich-v1/dist/main.js')?'football-rich-v1/dist':'dist';
const main=fs.readFileSync(root+'/main.js','utf8');
const css=fs.readFileSync(root+'/styles/main.css','utf8');
const syntax=spawnSync('node',['--check',root+'/main.js'],{encoding:'utf8'});
assert.equal(syntax.status,0,'Generated main.js syntax must pass: '+syntax.stderr);
for(const marker of [
  "currentView === 'football-time-legacy-result-import'",
  'legacy_match_result_snapshots',
  'non_revision_legacy',
  'not_independently_verified',
  'revision_history_available',
  'footballTimeLegacyResultSnapshot',
  'footballTimeLegacyResultReadOnly:true',
  'buildLegacyPlan',
  'confirm-ft-legacy-result-import',
  "db.transaction(['matches'],'readwrite')",
  "tx.objectStore('matches')"
]) assert.ok(main.includes(marker),'Missing Legacy Snapshot import behavior: '+marker);
assert.ok(main.includes("m.sharedMatchId===record.match_id"),'Import must use exact Shared Match ID mapping');
assert.ok(main.includes("stableLegacy(previous)!==stableLegacy(record)"),'Conflicting legacy snapshots must be rejected');
const routeStart=main.indexOf("currentView === 'football-time-legacy-result-import'");
const routeEnd=main.indexOf("currentView === 'settings'",routeStart);
assert.ok(routeStart>=0&&routeEnd>routeStart,'Legacy import route boundaries must exist');
const route=main.slice(routeStart,routeEnd);
assert.ok(route.includes("payload.data_type!=='legacy_match_result_snapshots'"));
assert.ok(route.includes("r.evidence.verification_status!=='not_independently_verified'"));
assert.ok(route.includes("r.evidence.revision_history_available!==false"));
assert.ok(route.includes("Object.prototype.hasOwnProperty.call(r,key)"));
for(const forbidden of ["db.transaction(['match_results'],'readwrite')","tx.objectStore('match_results')","objectStore('predictions')","objectStore('analyses')","objectStore('performance_records')","indexedDB.deleteDatabase(","objectStore('matches').clear(","objectStore('matches').delete("]) {
  assert.ok(!route.includes(forbidden),'Legacy import must not mutate other stores or delete data: '+forbidden);
}
assert.ok(css.includes('#confirm-ft-legacy-result-import:disabled'));
console.log('Football Time Legacy Snapshot import tests passed: exact Shared Match ID mapping, explicit unverified classification, conflict protection, additive matches-only storage, and no performance/result-store mutation.');
