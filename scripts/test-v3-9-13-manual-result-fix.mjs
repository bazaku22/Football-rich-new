import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=process.argv[2]||'football-rich-v1/dist';
const main=fs.readFileSync(root+'/main.js','utf8');
const html=fs.readFileSync(root+'/index.html','utf8');
const sw=fs.readFileSync(root+'/sw.js','utf8');
const version=JSON.parse(fs.readFileSync(root+'/app-version.json','utf8'));
assert.equal(version.version,'3.9.13');
assert.equal(version.previous_version,'3.9.12');
assert.equal(version.release,'V3.9.13 — Reliable Match ID copy and manual result import');
execFileSync(process.execPath,['--check',root+'/main.js'],{stdio:'inherit'});
for(const marker of [
 "const APP_VERSION='3.9.13';",
 'window.__frPrepareResultPayload = processResultPayload',
 'await window.__frPrepareResultPayload(payload)',
 'const processResultPayload = async payload =>',
 'validateResultPayload(payload)',
 'confirm-result-import',
 'allow-result-correction',
 'if(!copied)copied=fallbackCopy()',
 'navigator.clipboard?.writeText',
 "count=bell?.querySelector('#fr-notification-count')",
 'v39-manual-form',
 'data-v39-copy-id'
])assert.ok(main.includes(marker),'Missing '+marker);
assert.ok(!main.includes('new DataTransfer()'));
assert.ok(!main.includes('input.files=transfer.files'));
assert.ok(html.includes('main.js?v=20261121-v3-9-13'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v68'"));
assert.ok(!main.includes('indexedDB.deleteDatabase(')&&!main.includes('objectStore.clear('));
console.log('PASS V3.9.13 static regression checks: shared import path, confirmation/revision flow, clipboard fallback, cache bust and no destructive DB operations.');
