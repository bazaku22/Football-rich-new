import fs from 'node:fs';
import assert from 'node:assert/strict';

const main=fs.readFileSync('dist/main.js','utf8');
const css=fs.readFileSync('dist/styles/main.css','utf8');
const html=fs.readFileSync('dist/index.html','utf8');
const sw=fs.readFileSync('dist/sw.js','utf8');
const version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));
const batchSource=fs.readFileSync('../scripts/analysis-import-batch-branch.js.txt','utf8');

assert.equal(version.version,'3.3');
assert.equal(version.previous_version,'3.2');
assert.ok(html.includes('main.js?v=20261116-v3-3'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v49'"));
for(const route of ["currentView === 'tools'","currentView === 'fixture-import'","currentView === 'result-import'","currentView === 'settings'"]) assert.ok(main.includes(route),'Missing route: '+route);
assert.ok(main.includes('const safeImportMessage='),'Analysis importer must guard a missing status element');
assert.ok(main.includes('const zipReports=async file=>'),'ZIP batch parser must remain available');
assert.ok(main.includes('application/zip'),'Analysis importer must accept ZIP files');
assert.ok(!main.includes("setMessage('#analysis-import-message',"),'Analysis importer must not call the unsafe status helper');
for(const marker of ["['tools', 'เครื่องมือ']",'นำเข้าโปรแกรมแข่งขัน','นำเข้ารายงานวิเคราะห์','สรุปผลการแข่งขัน','fixture-import-file','result-import-file','analysis-import-existing-only','yellow_card','red_card','revisionHistory','football-rich-fixtures']) assert.ok(main.includes(marker),'Missing V3.2 marker: '+marker);
assert.ok(/currentView\s*===\s*['"]import['"]/.test(main));
assert.ok(css.includes('.tools-grid'));
assert.ok(!main.includes("['import', 'นำเข้ารายงาน']"));
assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(!main.includes('objectStore.clear('));

assert.ok(main.includes('sameReportIdUpdate'),'Generated app must support updating an already-imported report_id');
assert.ok(batchSource.includes('priorReports.some(a=>a.matchId!==match.id)'),'Duplicate report_id must be tied to the same existing Match ID');
assert.ok(batchSource.includes('current.some(a=>a.matchId!==item.match.id)'),'Confirm step must re-check duplicate report ownership');
assert.ok(batchSource.includes('อัปเดตรายงานเดิม'),'Importer must clearly report how many prior report IDs were updated');
assert.ok(!batchSource.includes("มี report_id ที่เคยนำเข้าแล้ว กรุณาตรวจสอบไฟล์"),'Old duplicate report_id hard rejection must be removed');
console.log('V3.3 Tools tests passed: three tools are grouped under Tools; fixture duplicates are skipped; analysis import and result revision history remain; no destructive database operation.');
