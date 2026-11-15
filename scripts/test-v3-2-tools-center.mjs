import fs from 'node:fs';
import assert from 'node:assert/strict';

const main=fs.readFileSync('dist/main.js','utf8');
const css=fs.readFileSync('dist/styles/main.css','utf8');
const html=fs.readFileSync('dist/index.html','utf8');
const sw=fs.readFileSync('dist/sw.js','utf8');
const version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));

assert.equal(version.version,'3.2');
assert.ok(html.includes('main.js?v=20261116-v3-2'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v48'"));
for(const route of ["currentView === 'tools'","currentView === 'fixture-import'","currentView === 'import'","currentView === 'result-import'","currentView === 'settings'"]) assert.ok(main.includes(route),'Missing route: '+route);
for(const marker of ["['tools', 'เครื่องมือ']",'นำเข้าโปรแกรมแข่งขัน','นำเข้ารายงานวิเคราะห์','สรุปผลการแข่งขัน','fixture-import-file','result-import-file','analysis-import-existing-only','analysis-import-existing-only','yellow_card','red_card','revisionHistory','football-rich-fixtures']) assert.ok(main.includes(marker),'Missing V3.2 marker: '+marker);
assert.ok(css.includes('.tools-grid'));
assert.ok(!main.includes("['import', 'นำเข้ารายงาน']"));
assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(!main.includes('objectStore.clear('));
console.log('V3.2 Tools tests passed: three tools are grouped under Tools; fixture duplicates are skipped; analysis import and result revision history remain; no destructive database operation.');
