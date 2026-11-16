import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.argv[2] || 'football-rich-v1/dist';
const app = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'app-version.json'), 'utf8'));

assert.ok(app.includes("riskScore!==null?(riskScore<=34?['ต่ำ','low']:riskScore<=64?['กลาง','medium']:['สูง','high'])"), 'Risk label must be derived from the composite risk score using the agreed provisional bands');
assert.ok(app.includes("Risk Score '+riskScore.toFixed(0)"), 'Card must show one compact Risk Score value');
assert.ok(!app.includes("v30-confidence"), 'Separate data-confidence badge must not be rendered');
assert.ok(!app.includes("/100</small>"), 'Risk score must use the compact display without extra /100 text');
assert.ok(app.includes("const APP_VERSION='3.8'") && app.includes('V3.8'), 'Visible and internal app version must be V3.8');
assert.ok(html.includes('main.js?v=20261116-v3-8'), 'HTML must reference the V3.8 cache-busted app entry');
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v54'"), 'Service worker cache must be bumped');
assert.equal(version.version, '3.8');
assert.equal(version.previous_version, '3.7');
assert.equal(version.release, 'V3.8-beta.1');

const scoreToLevel = score => score <= 34 ? 'ต่ำ' : score <= 64 ? 'กลาง' : 'สูง';
assert.equal(scoreToLevel(0), 'ต่ำ');
assert.equal(scoreToLevel(34), 'ต่ำ');
assert.equal(scoreToLevel(35), 'กลาง');
assert.equal(scoreToLevel(64), 'กลาง');
assert.equal(scoreToLevel(65), 'สูง');
assert.equal(scoreToLevel(100), 'สูง');
console.log('V3.8 compact risk badge regression tests passed.');
