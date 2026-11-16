import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const root='football-rich-v1/dist';
const main=fs.readFileSync(root+'/main.js','utf8');
const html=fs.readFileSync(root+'/index.html','utf8');
const sw=fs.readFileSync(root+'/sw.js','utf8');
const version=JSON.parse(fs.readFileSync(root+'/app-version.json','utf8'));
const syntax=spawnSync('node',['--check',root+'/main.js'],{encoding:'utf8'});
assert.equal(syntax.status,0,syntax.stderr);
assert.equal(version.version,'3.9.4');
assert.equal(version.previous_version,'3.9.3');
assert.ok(html.includes('main.js?v=20261116-v3-9-4'));
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v59'"));
assert.ok(main.includes("const APP_VERSION='3.9.4';"));
assert.ok(main.includes("currentView === 'football-time-import'"));
assert.ok(main.includes('FT-M-FOOTBALLDATA-'));
console.log('Football rich V3.9.4 final release checks passed: import route, cache bust, service worker v59, version manifest and JavaScript syntax.');
