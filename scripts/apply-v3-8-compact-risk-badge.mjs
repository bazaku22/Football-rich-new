import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'football-rich-v1/dist';
const mainFile = path.join(root, 'main.js');
const htmlFile = path.join(root, 'index.html');
const swFile = path.join(root, 'sw.js');
const versionFile = path.join(root, 'app-version.json');

for (const file of [mainFile, htmlFile, swFile, versionFile]) {
  if (!fs.existsSync(file)) throw new Error(`Required V3.8 build file missing: ${file}`);
}

let app = fs.readFileSync(mainFile, 'utf8');
const oldCardState = "cover=a?.coverProbability,level=risk(a?.riskLevel||a?.sourceReport?.analysis?.risk_level);";
const newCardState = "cover=a?.coverProbability,riskScore=Number.isFinite(a?.sourceReport?.analysis?.risk_score)?Number(a.sourceReport.analysis.risk_score):null,level=riskScore!==null?(riskScore<=34?['ต่ำ','low']:riskScore<=64?['กลาง','medium']:['สูง','high']):risk(a?.riskLevel||a?.sourceReport?.analysis?.risk_level);";
if (!app.includes(oldCardState)) {
  if (!app.includes(newCardState)) throw new Error('Could not locate the V3.7 match-card risk state for a safe V3.8 replacement');
} else {
  app = app.replace(oldCardState, newCardState);
}

const oldRiskFooter = "(Number.isFinite(a?.sourceReport?.analysis?.risk_score)?'<small class=\"v30-risk-score\">Risk Score '+Number(a.sourceReport.analysis.risk_score).toFixed(0)+'/100</small>':'')+(Number.isFinite(a?.sourceReport?.analysis?.data_confidence)?'<small class=\"v30-confidence\">ข้อมูล '+Number(a.sourceReport.analysis.data_confidence).toFixed(0)+'/100</small>':'')";
const newRiskFooter = "(riskScore!==null?'<small class=\"v30-risk-score\">Risk Score '+riskScore.toFixed(0)+'</small>':'')";
if (!app.includes(oldRiskFooter)) {
  if (!app.includes(newRiskFooter)) throw new Error('Could not locate the V3.7 risk footer for a safe V3.8 replacement');
} else {
  app = app.replace(oldRiskFooter, newRiskFooter);
}

app = app.replaceAll('V3.7', 'V3.8');
app = app.replace("const APP_VERSION='3.7'", "const APP_VERSION='3.8'");
if (!app.includes("const APP_VERSION='3.8'")) throw new Error('Could not update the internal app version marker');
fs.writeFileSync(mainFile, app);

let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace(/main\.js(?:\?[^"']*)?/g, 'main.js?v=20261116-v3-8');
if (!html.includes('main.js?v=20261116-v3-8')) throw new Error('Could not update the V3.8 cache-busted app entry');
fs.writeFileSync(htmlFile, html);

let sw = fs.readFileSync(swFile, 'utf8');
if (!sw.includes("const CACHE_NAME = 'football-rich-shell-v53'")) throw new Error('Unexpected service-worker cache version; refusing an unsafe replacement');
sw = sw.replace("const CACHE_NAME = 'football-rich-shell-v53'", "const CACHE_NAME = 'football-rich-shell-v54'");
fs.writeFileSync(swFile, sw);

const version = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
if (version.version !== '3.7') throw new Error(`Expected V3.7 app-version.json, found ${version.version}`);
version.previous_version = '3.7';
version.version = '3.8';
version.release = 'V3.8-beta.1';
fs.writeFileSync(versionFile, JSON.stringify(version, null, 2) + '\n');

console.log('V3.8 compact risk badge applied: composite score drives the single risk label; data-confidence text is hidden; app and service-worker versions updated.');
