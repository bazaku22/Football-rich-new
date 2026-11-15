import fs from 'node:fs';

const mainPath='dist/main.js',cssPath='dist/styles/main.css',htmlPath='dist/index.html',swPath='dist/sw.js',versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
const handicapPath='dist/domain/handicap.js';
let handicap=fs.readFileSync(handicapPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));

const oldHandicapList='0, -0.25, -0.5, -0.75, -1, -1.25, -1.5, -1.75, -2, -2.25, -2.5, -2.75, -3, -3.25, -3.5, -3.75, -4';
const newHandicapList='-4, -3.75, -3.5, -3.25, -3, -2.75, -2.5, -2.25, -2, -1.75, -1.5, -1.25, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4';
if(handicap.includes(oldHandicapList)) handicap=handicap.replace(oldHandicapList,newHandicapList);
else if(!handicap.includes(newHandicapList)) throw new Error('Could not verify the AH calculator line range');
fs.writeFileSync(handicapPath,handicap);

if(!main.includes("const APP_VERSION='2.4';")) throw new Error('V3.0 expected V2.4 main bundle anchor missing');
if(!html.includes('main.js?v=20261116-v2-4')) throw new Error('V3.0 expected V2.4 HTML cache anchor missing');
if(!sw.includes("const CACHE_NAME = 'football-rich-shell-v45'")) throw new Error('V3.0 expected V2.4 service worker cache anchor missing');

const oldBottom='<span class="v21-risk '+level[1]+'">ความเสี่ยง '+level[0]+'</span><small>Match ID · '+esc(m.id)+'</small>';
const newBottom='<span class="v21-risk '+level[1]+'">ความเสี่ยง '+level[0]+'</span>'+(Number.isFinite(a?.sourceReport?.analysis?.risk_score)?'<small class="v30-risk-score">Risk Score '+Number(a.sourceReport.analysis.risk_score).toFixed(0)+'/100</small>':'')+(Number.isFinite(a?.sourceReport?.analysis?.data_confidence)?'<small class="v30-confidence">ข้อมูล '+Number(a.sourceReport.analysis.data_confidence).toFixed(0)+'/100</small>':'')+'<small>Match ID · '+esc(m.id)+'</small>';
if(!main.includes(oldBottom)) throw new Error('V2.4 Match Center risk footer anchor missing');
main=main.replace(oldBottom,newBottom);
main=main.replace("const APP_VERSION='2.4';","const APP_VERSION='3.0';")
 .replace("const PREVIOUS_APP_VERSION='2.3';","const PREVIOUS_APP_VERSION='2.4';")
 .replaceAll('FOOTBALL RICH · BLACK & GOLD · V2.4','FOOTBALL RICH · BLACK & GOLD · V3.0')
 .replace('<span class="tag">V2.4</span>','<span class="tag">V3.0</span>');
if(!main.includes("const APP_VERSION='3.0';")) throw new Error('Could not set V3.0 app version');
css += String.raw`
/* V3.0: show uncertainty score and data confidence separately from forecast probabilities */
.v30-risk-score,.v30-confidence{display:inline-flex;align-items:center;gap:4px;color:#d8c18a;font-size:11px;font-weight:650;white-space:nowrap}
.v30-confidence{color:#a9c8b8}
@media(max-width:650px){.v30-risk-score,.v30-confidence{font-size:10px}}
`;
html=html.replaceAll('main.js?v=20261116-v2-4','main.js?v=20261116-v3-0');
if(!html.includes('main.js?v=20261116-v3-0')) throw new Error('Could not update V3.0 cache-busted app entry');
sw=sw.replaceAll('football-rich-shell-v45','football-rich-shell-v46');
if(!sw.includes("const CACHE_NAME = 'football-rich-shell-v46'")) throw new Error('Could not update V3.0 service worker cache');
version.version='3.0';
version.previous_version='2.4';
version.release='V3.0-beta.1';
fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');
console.log('Applied V3.0: two-sided AH import support, Risk Score and Data Confidence presentation, app/cache version.');
