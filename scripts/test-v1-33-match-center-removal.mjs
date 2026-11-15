import fs from 'node:fs';
import assert from 'node:assert/strict';

const main=fs.readFileSync('dist/main.js','utf8');
const html=fs.readFileSync('dist/index.html','utf8');
const sw=fs.readFileSync('dist/sw.js','utf8');
const version=JSON.parse(fs.readFileSync('dist/app-version.json','utf8'));

assert.equal(version.version,'1.33');
assert.ok(html.includes('main.js?v=20261116-v1-33'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v41'"));

const navStart=main.indexOf('const navItems = [');
const navEnd=main.indexOf('];',navStart);
assert.ok(navStart>=0 && navEnd>navStart);
assert.ok(!main.slice(navStart,navEnd).includes("'matches'"),'Match Center must be removed from navigation');

for(const marker of ['data-select-match','data-open-match-detail','mc-detail-modal','result-import-file','match-form','renderMatchesByDay','mc-day-section','mc-status-upcoming','mc-status-live','mc-status-finished']) {
  assert.ok(!main.includes(marker),'Match Center UI marker must be absent: '+marker);
}
assert.ok(!main.includes('data-go="matches"'),'old dashboard shortcut must be removed');
assert.ok(main.includes('ส่วนโปรแกรมแข่งขันกำลังปรับปรุง'));
assert.ok(main.includes('รหัส Match ID ไฟล์โปรแกรม และสถิติหลังแข่งยังคงเก็บไว้ในอุปกรณ์'));

// Confirm no destructive database commands were introduced by this UI-only patch.
assert.ok(!main.includes('indexedDB.deleteDatabase('));
assert.ok(!main.includes('objectStore.clear('));
console.log('V1.33 removal tests passed: no Match Center UI entry points remain; data stores are not deleted or cleared.');
