import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = process.argv[2] || 'football-rich-v1/dist';
const mainPath = path.join(root, 'main.js');
const htmlPath = path.join(root, 'index.html');
const swPath = path.join(root, 'sw.js');
const versionPath = path.join(root, 'app-version.json');
const app = fs.readFileSync(mainPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');
const sw = fs.readFileSync(swPath, 'utf8');
const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

assert.ok(app.includes('const calculateAhRisk=a=>'), 'AH-based risk calculator exists');
assert.ok(app.includes('riskAssessment=calculateAhRisk(a)'), 'match cards use AH-based assessment');
assert.ok(app.includes("level=riskAssessment?.level||['ยังประเมินไม่ได้','unknown']"), 'missing required inputs remain unassessed');
assert.ok(!app.includes('Number(a?.sourceReport?.analysis?.risk_score)'), 'imported risk_score no longer drives cards');
assert.ok(!app.includes('v30-risk-score'), 'legacy numeric Risk Score footer is removed');
assert.ok(app.includes("const APP_VERSION='3.9'"), 'internal app version is V3.9');
assert.ok(html.includes('main.js?v=20261116-v3-9'), 'HTML references the V3.9 app entry');
assert.ok(sw.includes("const CACHE_NAME = 'football-rich-shell-v55'"), 'service-worker cache is bumped');
assert.equal(version.version, '3.9');
assert.equal(version.previous_version, '3.8');
assert.equal(version.release, 'V3.9-beta.1');

const start = app.indexOf('const calculateAhRisk=a=>');
const end = app.indexOf('};', start) + 2;
assert.ok(start >= 0 && end > start, 'calculator source can be isolated');
const source = app.slice(start, end);
const sandbox = {};
vm.runInNewContext(source + '\nthis.calculateAhRisk = calculateAhRisk;', sandbox);
const calc = sandbox.calculateAhRisk;
const make = ({line=-0.5,cover=0.72,evidence=2,selected='home',home=0.48,away=0.25,confidence=75}={}) => ({
  marketSnapshot:{selected_team:selected,handicap_line:line},
  coverProbability:cover,
  dataConfidence:confidence,
  evidence:Array.from({length:evidence},(_,i)=>({claim:'Verified statistical evidence '+i})),
  sourceReport:{analysis:{match_outcome_probabilities:{home_win:home,draw:0.27,away_win:away}}}
});

assert.equal(calc(make()).level[1], 'low', 'moderate AH line + strong cover + multiple evidence + selected side favoured => low');
assert.equal(calc(make({line:-0.75})).level[1], 'medium', 'more demanding AH line cannot be low');
assert.equal(calc(make({cover:0.65})).level[1], 'medium', 'moderate cover probability => medium');
assert.equal(calc(make({line:-1.25,cover:0.82})).level[1], 'high', 'heavy handicap => high even with strong probability');
assert.equal(calc(make({cover:0.55})).level[1], 'high', 'weak cover probability => high');
assert.equal(calc(make({evidence:0})).level[1], 'high', 'no supporting evidence => high');
assert.equal(calc(make({home:0.2,away:0.5})).level[1], 'medium', 'contradictory 1X2 support blocks low-risk label');
assert.equal(calc(make({confidence:45})).level[1], 'medium', 'low data confidence blocks low-risk label');
assert.equal(calc({marketSnapshot:{selected_team:'none',handicap_line:null},coverProbability:null}), null, 'missing AH selection/cover => not assessed');
console.log('V3.9 AH-based risk regression tests passed.');
