import fs from 'node:fs';
import assert from 'node:assert/strict';

const main=fs.readFileSync('dist/main.js','utf8');
const html=fs.readFileSync('dist/index.html','utf8');
const sw=fs.readFileSync('dist/sw.js','utf8');
const version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));
const source=fs.readFileSync('../scripts/analysis-import-batch-branch.js.txt','utf8');
assert.equal(version.version,'3.1');
assert.equal(version.previous_version,'3.0');
assert.ok(html.includes('main.js?v=20261116-v3-1'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v47'"));
for(const marker of ['analysis-import-existing-only','sameKickoff','updateExistingOnly','ไม่มีการสร้างแมตช์ใหม่','Match ID เดิม','importReportId']) {
  assert.ok(source.includes(marker),'Missing safe importer marker: '+marker);
  assert.ok(main.includes(marker),'Generated app missing safe importer marker: '+marker);
}
assert.ok(source.includes('Math.abs(x-y)<=120000'),'Kickoff matching must be time-bound');
assert.ok(source.includes("if(updateExistingOnly&&m.length===0)throw Error("),'Update-only mode must abort unmatched fixtures');
assert.ok(source.includes("if(!existing)ms.add(m);"),'General import mode remains backward compatible');
assert.ok(source.includes("as.add({...base(),matchId:m.id,version"),'Analysis must be appended under the existing Match ID');
assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(!main.includes('objectStore.clear('));
console.log('V3.1 regression passed: exact existing-match resolution, kickoff tolerance, append-only analysis, no destructive database operations.');
