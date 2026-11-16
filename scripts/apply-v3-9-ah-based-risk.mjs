import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'football-rich-v1/dist';
const mainFile = path.join(root, 'main.js');
const htmlFile = path.join(root, 'index.html');
const swFile = path.join(root, 'sw.js');
const versionFile = path.join(root, 'app-version.json');
for (const file of [mainFile, htmlFile, swFile, versionFile]) {
  if (!fs.existsSync(file)) throw new Error('Required V3.9 file missing: ' + file);
}

let app = fs.readFileSync(mainFile, 'utf8');
const riskAnchor = " const risk=v=>{v=String(v||'').toLowerCase();return ['low','ต่ำ'].includes(v)?['ต่ำ','low']:['medium','moderate','กลาง'].includes(v)?['กลาง','medium']:['high','สูง'].includes(v)?['สูง','high']:['ยังประเมินไม่ได้','unknown'];};";
const helper = [
" const calculateAhRisk=a=>{",
"  if(!a)return null;",
"  const raw=a.sourceReport?.analysis||{};",
"  const market=a.marketSnapshot||a.sourceReport?.market||{};",
"  const selected=market.selected_team;",
"  const rawLine=market.handicap_line;",
"  const line=Number(rawLine);",
"  const cover=Number.isFinite(a.coverProbability)?a.coverProbability:raw.cover_probability;",
"  if(!['home','away'].includes(selected)||rawLine===null||rawLine===undefined||!Number.isFinite(line)||!Number.isFinite(cover)||cover<0||cover>1)return null;",
"  const evidence=Array.isArray(a.evidence)?a.evidence:(Array.isArray(a.sourceReport?.evidence)?a.sourceReport.evidence:[]);",
"  const evidenceCount=evidence.length;",
"  const outcomes=raw.match_outcome_probabilities||{};",
"  const selectedWin=Number(outcomes[selected==='home'?'home_win':'away_win']);",
"  const opponentWin=Number(outcomes[selected==='home'?'away_win':'home_win']);",
"  const hasOutcomeSupport=Number.isFinite(selectedWin)&&Number.isFinite(opponentWin);",
"  const selectedFavoured=hasOutcomeSupport&&selectedWin>=opponentWin;",
"  const confidence=Number.isFinite(a.dataConfidence)?a.dataConfidence:raw.data_confidence;",
"  const confidenceSupports=!Number.isFinite(confidence)||confidence>=60;",
"  const burden=Math.abs(line);",
"  let level;",
"  if(burden<=0.5&&cover>=0.70&&evidenceCount>=2&&selectedFavoured&&confidenceSupports)level=['ต่ำ','low'];",
"  else if(burden<=1.0&&cover>=0.60&&evidenceCount>=1)level=['กลาง','medium'];",
"  else level=['สูง','high'];",
"  return {level,line,cover,evidenceCount,selectedFavoured};",
" };"
].join('\n');
if (!app.includes(riskAnchor)) {
  if (!app.includes('const calculateAhRisk=a=>')) throw new Error('Risk helper anchor not found');
} else if (!app.includes('const calculateAhRisk=a=>')) {
  app = app.replace(riskAnchor, riskAnchor + '\n' + helper);
}

const oldState = "cover=a?.coverProbability,riskScore=Number.isFinite(a?.sourceReport?.analysis?.risk_score)?Number(a.sourceReport.analysis.risk_score):null,level=riskScore!==null?(riskScore<=34?['ต่ำ','low']:riskScore<=64?['กลาง','medium']:['สูง','high']):risk(a?.riskLevel||a?.sourceReport?.analysis?.risk_level);";
const newState = "cover=a?.coverProbability,riskAssessment=calculateAhRisk(a),level=riskAssessment?.level||['ยังประเมินไม่ได้','unknown'];";
if (app.includes(oldState)) app = app.replace(oldState, newState);
else if (!app.includes(newState)) throw new Error('Could not replace imported Risk Score card state safely');

const oldFooter = "(riskScore!==null?'<small class=\"v30-risk-score\">Risk Score '+riskScore.toFixed(0)+'</small>':'')";
if (app.includes(oldFooter)) app = app.replace(oldFooter, "''");
else if (app.includes('v30-risk-score')) throw new Error('Unexpected legacy Risk Score footer; refusing unsafe patch');

app = app.replaceAll('V3.8', 'V3.9').replace("const APP_VERSION='3.8'", "const APP_VERSION='3.9'");
if (!app.includes("const APP_VERSION='3.9'")) throw new Error('Internal app version did not update to V3.9');
fs.writeFileSync(mainFile, app);

let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace(/main\.js(?:\?[^"']*)?/g, 'main.js?v=20261116-v3-9');
if (!html.includes('main.js?v=20261116-v3-9')) throw new Error('V3.9 cache-busted app entry missing');
fs.writeFileSync(htmlFile, html);

let sw = fs.readFileSync(swFile, 'utf8');
if (!sw.includes("const CACHE_NAME = 'football-rich-shell-v54'")) throw new Error('Unexpected service-worker cache; expected v54 before V3.9');
sw = sw.replace("const CACHE_NAME = 'football-rich-shell-v54'", "const CACHE_NAME = 'football-rich-shell-v55'");
fs.writeFileSync(swFile, sw);

const version = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
if (version.version !== '3.8') throw new Error('Expected app-version.json 3.8 before V3.9');
version.previous_version = '3.8';
version.version = '3.9';
version.release = 'V3.9-beta.1';
fs.writeFileSync(versionFile, JSON.stringify(version, null, 2) + '\n');
console.log('V3.9 AH-based risk assessment applied. Imported risk_score is ignored; match records and history are untouched.');
