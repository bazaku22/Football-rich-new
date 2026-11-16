import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'football-rich-v1/dist';
const mainFile = path.join(root, 'main.js');
const htmlFile = path.join(root, 'index.html');
const swFile = path.join(root, 'sw.js');
const versionFile = path.join(root, 'app-version.json');
const cssFile = path.join(root, 'styles/main.css');
for (const file of [mainFile, htmlFile, swFile, versionFile, cssFile]) {
  if (!fs.existsSync(file)) throw new Error('Required V3.9.2 file missing: ' + file);
}

let app = fs.readFileSync(mainFile, 'utf8');
const start = app.indexOf('const calculateAhRisk=a=>{');
if (start < 0) throw new Error('V3.9.1 AH risk calculator not found');
const endMarker = '\n };';
const end = app.indexOf(endMarker, start);
if (end < 0) throw new Error('Could not locate end of AH risk calculator');
const helper = [
"const calculateAhRisk=a=>{",
"  if(!a)return null;",
"  const rawCover=a.coverProbability??a.sourceReport?.analysis?.cover_probability;",
"  const cover=Number(rawCover);",
"  if(rawCover===null||rawCover===undefined||!Number.isFinite(cover)||cover<0||cover>1)return null;",
"  if(cover>=0.55)return {level:['ต่ำ','low'],cover};",
"  if(cover>=0.45)return {level:['ปานกลาง','medium'],cover};",
"  if(cover>=0.35)return {level:['สูง','high'],cover};",
"  return {level:['สูงมาก','very-high'],cover};",
" };"
].join('\n');
app = app.slice(0, start) + helper + app.slice(end + endMarker.length);
if (!app.includes("level=riskAssessment?.level||['ยังประเมินไม่ได้','unknown']")) {
  throw new Error('Match card is not using the direct AH risk assessment');
}
app = app.replaceAll('V3.9.1', 'V3.9.2').replaceAll('V3.9', 'V3.9.2');
app = app.replace("const APP_VERSION='3.9.1'", "const APP_VERSION='3.9.2'");
if (!app.includes("const APP_VERSION='3.9.2'")) throw new Error('Internal app version did not update to V3.9.2');
fs.writeFileSync(mainFile, app);

let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace(/main\\.js(?:\\?[^"' ]*)?/g, 'main.js?v=20261116-v3-9-2');
if (!html.includes('main.js?v=20261116-v3-9-2')) throw new Error('V3.9.2 cache-busted app entry missing');
fs.writeFileSync(htmlFile, html);

let sw = fs.readFileSync(swFile, 'utf8');
if (!sw.includes("const CACHE_NAME = 'football-rich-shell-v56'")) throw new Error('Unexpected service-worker cache; expected v56 before V3.9.2');
sw = sw.replace("const CACHE_NAME = 'football-rich-shell-v56'", "const CACHE_NAME = 'football-rich-shell-v57'");
fs.writeFileSync(swFile, sw);

const version = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
if (version.version !== '3.9.1') throw new Error('Expected app-version.json 3.9.1 before V3.9.2');
version.previous_version = '3.9.1';
version.version = '3.9.2';
version.release = 'V3.9.2-beta.1';
fs.writeFileSync(versionFile, JSON.stringify(version, null, 2) + '\n');

let css = fs.readFileSync(cssFile, 'utf8');
css += `\n/* V3.9.2: distinguish the very-high AH risk band */\n.risk-badge.very-high,.risk-label.very-high,.v21-risk.very-high{background:rgba(239,68,68,.20);border-color:rgba(239,68,68,.48);color:#ff8b8b}\n`;
fs.writeFileSync(cssFile, css);
console.log('V3.9.2 four-level AH risk bands applied. Existing match records, imports, predictions and history are untouched.');
