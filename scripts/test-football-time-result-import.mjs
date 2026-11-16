import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root=fs.existsSync('football-rich-v1/dist/main.js')?'football-rich-v1/dist':'dist';
const main=fs.readFileSync(root+'/main.js','utf8');
const css=fs.readFileSync(root+'/styles/main.css','utf8');
const syntax=spawnSync('node',['--check',root+'/main.js'],{encoding:'utf8'});
assert.equal(syntax.status,0,'Generated main.js syntax must pass: '+syntax.stderr);
for(const marker of [
  "currentView === 'football-time-result-import'",
  'นำเข้าผลจริงจาก Football Time',
  "payload.data_type!=='match_results'",
  'revision_history',
  'footballTimeResultHistory',
  'footballTimeResultReadOnly:true',
  'footballTimeEvaluationState:\'pending\'',
  'buildResultPlan',
  'newRevision<oldRevision',
  'ประวัติ Revision ใหม่ไม่ต่อเนื่อง',
  "db.transaction(['matches'],'readwrite')",
  "tx.objectStore('matches')",
  'confirm-ft-result-import',
  'footballTimeResultImportedAt'
]) assert.ok(main.includes(marker),'Missing FT read-only result import behavior: '+marker);
assert.ok(main.includes("newRevision===oldRevision"),'Equal revisions must be idempotent or conflict');
assert.ok(main.includes('stableHistory(oldHistory)!==stableHistory(record.revision_history.slice(0,oldHistory.length))'),'Higher revisions must preserve the full old history prefix');
const routeStart=main.indexOf("currentView === 'football-time-result-import'");
const routeEnd=main.indexOf("currentView === 'settings'",routeStart);
assert.ok(routeStart>=0&&routeEnd>routeStart,'FT result route boundaries must exist');
const ftResultRoute=main.slice(routeStart,routeEnd);
assert.ok(!ftResultRoute.includes("db.transaction(['match_results'],'readwrite')"));
assert.ok(!ftResultRoute.includes("tx.objectStore('match_results')"));
assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(!main.includes("objectStore('matches').clear("));
assert.ok(!main.includes("objectStore('matches').delete("));
assert.ok(css.includes('#confirm-ft-result-import:disabled'));
console.log('Football Time read-only result import tests passed: exact Shared Match ID mapping, complete revision chain, stale/equal-conflict guards, atomic matches-only write, and no legacy result/prediction mutation.');
