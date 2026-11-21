import fs from 'node:fs';

const mainPath = 'src/main.ts';
let main = fs.readFileSync(mainPath, 'utf8');
if (main.includes("['scouting', 'ดาวรุ่ง']")) {
  console.log('Young Talent Scouting already applied.');
  process.exit(0);
}
main = main.replace(
  "  ['dashboard', 'ภาพรวม'], ['matches', 'คู่แข่งขัน'], ['research', 'ค้นคว้า'],",
  "  ['dashboard', 'ภาพรวม'], ['scouting', 'ดาวรุ่ง'], ['matches', 'คู่แข่งขัน'], ['research', 'ค้นคว้า'],"
);
if (!main.includes("['scouting', 'ดาวรุ่ง']")) throw new Error('Could not add Young Talent navigation item');

const rankingModule = fs.readFileSync('../scripts/young-talent-ranking.ts.txt', 'utf8');
fs.writeFileSync('src/domain/scouting-ranking.ts', rankingModule);
fs.writeFileSync('src/domain/scouting-ranking.test.ts', fs.readFileSync('../scripts/young-talent-ranking.test.ts.txt', 'utf8'));
main = main.replace("import type { AnalysisRecord, MatchRecord, PredictionRecord, ResearchRecord, SourceEvidenceRecord, MatchResultRecord, PerformanceRecord } from './data/schema';", "import type { AnalysisRecord, MatchRecord, PredictionRecord, ResearchRecord, SourceEvidenceRecord, MatchResultRecord, PerformanceRecord } from './data/schema';\nimport { sortScoutingPlayers } from './domain/scouting-ranking.js';");
const helpers = fs.readFileSync('../scripts/young-talent-helpers.txt', 'utf8');
main = main.replace("let selectedMatchId = '';", `let selectedMatchId = '';\n${helpers.trimEnd()}`);
main = main.replace("function switchView(view:View) { currentView=view; render().catch(showFatal); }", "function switchView(view:View) { if (view !== 'scouting') selectedScoutingPlayerId = ''; currentView=view; render().catch(showFatal); }");

const branchMarker = "  } else if(currentView==='matches') {";
if (!main.includes(branchMarker)) throw new Error('Could not find render branch insertion point');
const branch = fs.readFileSync('../scripts/young-talent-branch.txt', 'utf8');
main = main.replace(branchMarker, branch.trimEnd());

const eventMarker = "  root.querySelectorAll<HTMLElement>('[data-go]').forEach(el=>el.addEventListener('click',()=>switchView(el.dataset.go as View)));";
if (!main.includes(eventMarker)) throw new Error('Could not find delegated event insertion point');
main = main.replace(eventMarker, `  root.querySelectorAll<HTMLButtonElement>('[data-scout-open]').forEach(el=>el.addEventListener('click',()=>{selectedScoutingPlayerId=el.dataset.scoutOpen??'';currentScoutingTab='Overview';render().catch(showFatal);}));
  root.querySelectorAll<HTMLButtonElement>('[data-scout-back]').forEach(el=>el.addEventListener('click',()=>{selectedScoutingPlayerId='';render().catch(showFatal);}));
  root.querySelectorAll<HTMLButtonElement>('[data-scout-tab]').forEach(el=>el.addEventListener('click',()=>{currentScoutingTab=el.dataset.scoutTab??'Overview';render().catch(showFatal);}));
${eventMarker}`);
fs.writeFileSync(mainPath, main);

const swPath = 'public/sw.js';
let sw = fs.readFileSync(swPath, 'utf8');
for (const version of ['v2','v7','v8','v9','v10']) sw = sw.replaceAll('football-rich-shell-' + version, 'football-rich-shell-v11');
if (!sw.includes("const CACHE_NAME = 'football-rich-shell-v11'")) throw new Error('Service worker cache version was not upgraded to v11');
if (!sw.includes("'/domain/scouting-ranking.js'")) {
  sw = sw.replace("const APP_SHELL = [", "const APP_SHELL = ['/domain/scouting-ranking.js', ");
}
fs.writeFileSync(swPath, sw);

const cssPath = 'src/styles/main.css';
fs.appendFileSync(cssPath, `

/* Young Talent Scouting V1 — single grade-first ranking, player cards and profiles */
.scout-ranking-rule{border-color:#78602d;background:linear-gradient(135deg,#292113,#191713);margin-bottom:18px}.scout-ranking-rule p{margin:9px 0 4px;color:#e9e3d5;font-size:13px}.scout-ranking-rule small{color:#a99d83;font-size:11px}.scout-list-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 12px}.scout-list-head h2{font-size:17px;margin:0}.scout-list-head input{width:min(100%,290px);background:#15130f;color:#e9e3d5;border:1px solid #51452d;border-radius:10px;padding:10px 12px;min-height:42px}.scout-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.scout-card{margin:0;padding:14px}.scout-card-main{display:grid;grid-template-columns:68px minmax(0,1fr) 54px;gap:9px;align-items:center;min-width:0}.scout-rank{font-weight:800;color:#e5c477;font-size:16px}.scout-photo{position:relative;overflow:hidden;background:linear-gradient(145deg,#312817,#17140f);border:1px solid #51452d;border-radius:12px;display:grid;place-items:center;isolation:isolate}.scout-photo-card{width:68px;height:82px}.scout-photo-profile{width:min(100%,190px);height:210px;border-radius:16px}.scout-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;z-index:2}.scout-photo span{font-weight:800;color:#e5c477;font-size:22px}.scout-photo-profile span{font-size:36px}.scout-photo.photo-failed img{display:none}.scout-card-info{min-width:0}.scout-card-info h3{font-size:13px;line-height:1.4;margin:0 0 6px;color:#f1e7d0;overflow-wrap:anywhere}.scout-card-info h3 span,.scout-profile-name h2 span{color:#e5c477;font-size:12px}.scout-club-line{display:flex;align-items:center;gap:6px;color:#c8bda8;font-size:11px;min-width:0}.scout-crest-wrap{position:relative;display:inline-grid;place-items:center;flex:0 0 20px;width:20px;height:20px}.scout-crest{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:2}.scout-crest-fallback{font-size:6px;font-weight:800;color:#e5c477}.scout-card-info>p{color:#a99d83;font-size:10px;margin:5px 0}.scout-loan-note{display:block;color:#a99d83;font-size:9px;margin-top:3px}.scout-metrics{display:flex;gap:9px;flex-wrap:wrap;color:#a99d83;font-size:10px;margin-top:7px}.scout-metrics b{color:#e5c477;margin-left:3px}.scout-jersey{display:block;flex-shrink:0;overflow:visible}.scout-jersey-card{width:54px;height:60px}.scout-jersey-profile{width:62px;height:70px}.scout-open{width:100%;margin-top:12px;min-height:36px;padding:7px 12px;display:flex;justify-content:space-between;align-items:center}.scout-open span{font-size:17px}.scout-back{margin:-8px 0 14px}.scout-profile-hero{display:grid;grid-template-columns:190px minmax(0,1fr);gap:20px;align-items:center}.scout-profile-photo{min-width:0}.scout-profile-summary{min-width:0}.scout-profile-name{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.scout-profile-name h2{font-size:22px;margin:0;color:#f1e7d0}.scout-profile-summary>.muted{margin:7px 0}.scout-tabs{display:flex;gap:7px;overflow-x:auto;margin:14px 0}.scout-tabs button{white-space:nowrap;border:1px solid #51452d;background:#211d14;color:#b9b1a2;border-radius:9px;padding:9px 12px;font-size:11px}.scout-tabs button.active{border-color:#b78b32;color:#f4d27b;background:#302718}.scout-edit-panel{margin-top:15px}.scout-source-note{margin-top:10px}.scout-card[hidden]{display:none!important}
@media(max-width:850px){.scout-grid{grid-template-columns:1fr}}
@media(max-width:650px){.scout-list-head{align-items:stretch;flex-direction:column}.scout-list-head input{width:100%}.scout-card{padding:12px}.scout-card-main{grid-template-columns:62px minmax(0,1fr) 48px;gap:7px}.scout-photo-card{width:62px;height:76px}.scout-card-info h3{font-size:12px}.scout-jersey-card{width:48px;height:56px}.scout-profile-hero{grid-template-columns:112px minmax(0,1fr);gap:12px;padding:13px}.scout-photo-profile{width:112px;height:142px}.scout-profile-name h2{font-size:17px}.scout-profile-name{gap:5px}.scout-jersey-profile{width:48px;height:56px}.scout-metrics{gap:7px}.scout-profile-summary>.muted{font-size:11px}.scout-tabs{gap:5px}.scout-tabs button{padding:8px 10px;font-size:10px}}
`);

console.log('Young Talent Scouting V1 applied: one ranking list, grade-first/value-second sorting, local persistence, player portraits, club crests and jersey miniatures.');
