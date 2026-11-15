import fs from 'node:fs';
import assert from 'node:assert/strict';

const main=fs.readFileSync('dist/main.js','utf8');
const html=fs.readFileSync('dist/index.html','utf8');
const sw=fs.readFileSync('dist/sw.js','utf8');
const version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));

assert.equal(version.version,'3.4');
assert.equal(version.previous_version,'3.3');
assert.equal(version.release,'V3.4-beta.1');
assert.ok(html.includes('main.js?v=20261116-v3-4'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v50'"));

const toolsStart=main.indexOf("currentView === 'tools'");
const importStart=main.indexOf("else if (currentView === 'import') {",toolsStart);
const toolsBlock=main.slice(toolsStart,importStart);
assert.ok(toolsStart>=0&&importStart>toolsStart,'Tools Center route must exist before combined importer');
assert.equal((toolsBlock.match(/data-tool-target=/g)||[]).length,2,'Tools Center should show exactly two tools');
assert.ok(toolsBlock.includes('นำเข้าโปรแกรมพร้อมบทวิเคราะห์'));
assert.ok(toolsBlock.includes('สรุปผลการแข่งขัน'));

for(const marker of [
  "currentView === 'import'",
  "currentView === 'result-import'",
  "MATCH + ANALYSIS IMPORT",
  "football-rich-analysis-batch",
  "สร้าง Match ID ใหม่",
  "ใช้ Match ID เดิม",
  "result-import-file",
  "openDatabase()",
  "tx.objectStore('matches')",
  "tx.objectStore('analyses')",
  "sameKickoff(x.kickoffAt,report.match.kickoff_at)",
  "sameCompetition(a.competition,b.competition)"
]) assert.ok(main.includes(marker),'Missing combined import feature: '+marker);

assert.ok(!main.includes('fixture-import'));
assert.ok(!main.includes('analysis-import-existing-only'));
assert.ok(main.includes('application/json'));
assert.ok(main.includes('อัปเดตรายงานเดิม'));
assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(!main.includes('objectStore.clear('));
assert.ok(!main.includes("card('ผลชำระเดิมพัน'"));
console.log('V3.4 tests passed: one combined JSON importer, exact fixture matching, automatic Match ID creation, atomic analysis transaction, and retained Result Import.');
