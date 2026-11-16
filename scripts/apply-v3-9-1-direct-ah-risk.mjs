import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'football-rich-v1/dist';
const mainFile = path.join(root, 'main.js');
const htmlFile = path.join(root, 'index.html');
const swFile = path.join(root, 'sw.js');
const versionFile = path.join(root, 'app-version.json');
for (const file of [mainFile, htmlFile, swFile, versionFile]) {
  if (!fs.existsSync(file)) throw new Error('Required V3.9.1 file missing: ' + file);
}

let app = fs.readFileSync(mainFile, 'utf8');
const riskAnchor = " const risk=v=>{v=String(v||'').toLowerCase();return ['low','ต่ำ'].includes(v)?['ต่ำ','low']:['medium','moderate','กลาง'].includes(v)?['กลาง','medium']:['high','สูง'].includes(v)?['สูง','high']:['ยังประเมินไม่ได้','unknown'];};";
const helper = [
" const calculateAhRisk=a=>{",
"  if(!a)return null;",
"  const rawCover=a.coverProbability??a.sourceReport?.analysis?.cover_probability;",
"  const rawLine=a.recommendation?.handicap_line??a.marketSnapshot?.handicap_line??a.sourceReport?.market?.handicap_line;",
"  if(rawCover===null||rawCover===undefined||rawLine===null||rawLine===undefined)return null;",
"  const cover=Number(rawCover);",
"  const line=Number(rawLine);",
"  if(!Number.isFinite(cover)||cover<0||cover>1||!Number.isFinite(line))return null;",
"  const burden=Math.abs(line);",
"  if(cover>=0.70&&burden<=0.5)return {level:['ต่ำ','low'],cover,line};",
"  if(cover>=0.60&&burden<=1.0)return {level:['กลาง','medium'],cover,line};",
"  return {level:['สูง','high'],cover,line};",
" };"
].join('\n');
const helperStart = app.indexOf(' const calculateAhRisk=a=>{');
if (helperStart >= 0) {
  const helperEnd = app.indexOf('\\n };', helperStart) + 3;
  if (helperEnd <= helperStart) throw new Error('Could not locate complete previous AH risk helper');
  app = app.slice(0, helperStart) + helper + app.slice(helperEnd);
} else if (app.includes(riskAnchor)) {
  app = app.replace(riskAnchor, riskAnchor + '\\n' + helper);
} else {
  throw new Error('Risk helper anchor not found');
}

const oldState = "cover=a?.coverProbability,riskScore=Number.isFinite(a?.sourceReport?.analysis?.risk_score)?Number(a.sourceReport.analysis.risk_score):null,level=riskScore!==null?(riskScore<=34?['ต่ำ','low']:riskScore<=64?['กลาง','medium']:['สูง','high']):risk(a?.riskLevel||a?.sourceReport?.analysis?.risk_level);";
const newState = "cover=a?.coverProbability,riskAssessment=calculateAhRisk(a),level=riskAssessment?.level||['ยังประเมินไม่ได้','unknown'];";
if (app.includes(oldState)) app = app.replace(oldState, newState);
else if (!app.includes(newState)) throw new Error('Could not replace imported Risk Score card state safely');

const oldFooter = "(riskScore!==null?'<small class=\"v30-risk-score\">Risk Score '+riskScore.toFixed(0)+'</small>':'')";
if (app.includes(oldFooter)) app = app.replace(oldFooter, "''");
else if (app.includes('v30-risk-score')) throw new Error('Unexpected legacy Risk Score footer; refusing unsafe patch');

app = app.replaceAll('V3.9', 'V3.9.1').replace("const APP_VERSION='3.9'", "const APP_VERSION='3.9.1'");
if (!app.includes("const APP_VERSION='3.9.1'")) throw new Error('Internal app version did not update to V3.9.1');
fs.writeFileSync(mainFile, app);

let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace(/main\.js(?:\?[^"']*)?/g, 'main.js?v=20261116-v3-9-1');
if (!html.includes('main.js?v=20261116-v3-9-1')) throw new Error('V3.9.1 cache-busted app entry missing');
fs.writeFileSync(htmlFile, html);

let sw = fs.readFileSync(swFile, 'utf8');
if (!sw.includes("const CACHE_NAME = 'football-rich-shell-v55'")) throw new Error('Unexpected service-worker cache; expected v55 before V3.9.1');
sw = sw.replace("const CACHE_NAME = 'football-rich-shell-v55'", "const CACHE_NAME = 'football-rich-shell-v56'");
fs.writeFileSync(swFile, sw);

const version = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
if (version.version !== '3.9') throw new Error('Expected app-version.json 3.9 before V3.9.1');
version.previous_version = '3.9';
version.version = '3.9.1';
version.release = 'V3.9.1-beta.1';
fs.writeFileSync(versionFile, JSON.stringify(version, null, 2) + '\n');
console.log('V3.9.1 uses the exact imported AH coverProbability shown in Match Center; AH handicap burden adjusts the risk band. Imported match data and history remain untouched.');
