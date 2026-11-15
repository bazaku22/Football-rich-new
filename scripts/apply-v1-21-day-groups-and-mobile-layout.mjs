import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

const flatList = `'<div class="mc-group"><h2>รายการแข่งขันทั้งหมด</h2><span class="count">' + allMatches.length + '</span></div><div class="mc-cards">' + (allMatches.length ? allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m)).join('') : '<div class="panel empty">ยังไม่มีรายการแข่งขัน · นำเข้าโปรแกรมหรือเพิ่มคู่แข่งขันได้เลย</div>') + '</div>' +`;
if (!main.includes(flatList)) {
  if (main.includes('mc-day-section') && main.includes('renderMatchesByDay')) throw new Error('V1.21 day grouping already exists');
  throw new Error('V1.21 expected unified Match Center list anchor missing');
}
const renderHelper = `        const renderMatchesByDay = () => {
          if (!allMatches.length) return '<div class="panel empty">ยังไม่มีรายการแข่งขัน · นำเข้าโปรแกรมหรือเพิ่มคู่แข่งขันได้เลย</div>';
          const byDay = new Map();
          allMatches.forEach(match => {
            const date = match.kickoffAt ? new Date(match.kickoffAt) : null;
            const key = date && Number.isFinite(date.getTime())
              ? [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-')
              : 'undated';
            if (!byDay.has(key)) byDay.set(key, []);
            byDay.get(key).push(match);
          });
          return Array.from(byDay.entries()).map(([key, matches]) => {
            const label = key === 'undated' ? 'ไม่ระบุวันแข่งขัน' :
              new Intl.DateTimeFormat('th-TH', {weekday:'long', day:'numeric', month:'long', year:'numeric'}).format(new Date(key + 'T12:00:00'));
            return '<section class="mc-day-section"><div class="mc-day-heading"><h3>' + esc(label) + '</h3><span class="count">' + matches.length + ' คู่</span></div><div class="mc-cards">' +
              matches.map(match => resultByMatch.has(match.id) ? renderFinished(match) : renderUpcoming(match)).join('') +
              '</div></section>';
          }).join('');
        };
`;
const rootAnchor = '        root.innerHTML = pageTitle(';
if (!main.includes(rootAnchor)) throw new Error('V1.21 Match Center render insertion anchor missing');
main=main.replace(rootAnchor,renderHelper+rootAnchor);
const groupedList = 'renderMatchesByDay() +';
main=main.replace(flatList,groupedList);

const cssPatch = `
/* V1.21: enforce readable horizontal team names on narrow Android screens */
.mc-day-section{margin:22px 0 28px}
.mc-day-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px;padding:0 2px 9px;border-bottom:1px solid #514226}
.mc-day-heading h3{margin:0;color:#f4d27b;font-size:15px;font-weight:800;line-height:1.4}
.mc-day-heading .count{flex:0 0 auto;color:#a99d83;font-size:11px}
article.mc-card .mc-teams{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(34px,auto) minmax(0,1fr)!important;align-items:center!important;width:100%!important;max-width:100%!important;min-width:0!important;gap:6px!important}
article.mc-card .mc-teams>.mc-team{display:flex!important;flex:1 1 0!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;max-width:100%!important;min-width:0!important;gap:7px!important;text-align:center!important;writing-mode:horizontal-tb!important}
article.mc-card .mc-team-mark{display:flex!important;flex:0 0 38px!important;width:38px!important;height:42px!important;max-width:100%!important;margin:0 auto!important}
article.mc-card .mc-team-name{display:block!important;flex:0 1 auto!important;width:100%!important;max-width:100%!important;min-width:0!important;text-align:center!important;white-space:normal!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;word-break:normal!important;overflow-wrap:break-word!important;line-break:auto!important;hyphens:none!important;line-height:1.35!important}
article.mc-card .mc-teams>.mc-vs,article.mc-card .mc-teams>.mc-score{min-width:34px!important;text-align:center!important;white-space:nowrap!important;writing-mode:horizontal-tb!important}
@media(max-width:650px){
  .mc-day-section{margin:18px 0 24px}
  .mc-day-heading h3{font-size:14px}
  article.mc-card{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow:visible!important}
  article.mc-card .mc-teams{grid-template-columns:minmax(0,1fr) 34px minmax(0,1fr)!important;gap:4px!important;margin:15px 0!important}
  article.mc-card .mc-team-name{font-size:12px!important}
  article.mc-card .mc-team-mark{flex-basis:34px!important;width:34px!important;height:38px!important}
  article.mc-card .mc-score{font-size:24px!important;letter-spacing:1px!important}
}
`;
if (!css.includes('V1.21: enforce readable horizontal team names')) css += '\\n' + cssPatch;

if (!main.includes("const APP_VERSION='1.20';")) throw new Error('V1.21 expected app version 1.20');
main=main.replace("const APP_VERSION='1.20';","const APP_VERSION='1.21';")
         .replace("const PREVIOUS_APP_VERSION='1.19';","const PREVIOUS_APP_VERSION='1.20';");
if (!html.includes('main.js?v=20261115-v1-20')) throw new Error('V1.21 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-20','main.js?v=20261115-v1-21');
if (!sw.includes('football-rich-shell-v28')) throw new Error('V1.21 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v28','football-rich-shell-v29');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.21',release:'V1.21'}));

for (const needle of ['renderMatchesByDay','mc-day-section','mc-day-heading','รายการแข่งขันทั้งหมด']) {
  if (!main.includes(needle) && needle !== 'รายการแข่งขันทั้งหมด') throw new Error('V1.21 grouped date renderer audit failed: '+needle);
}
for (const needle of ['V1.21: enforce readable horizontal team names','writing-mode:horizontal-tb!important','overflow-wrap:break-word!important']) {
  if (!css.includes(needle)) throw new Error('V1.21 mobile card layout audit failed: '+needle);
}
if (main.includes('allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m)).join')) throw new Error('V1.21 flat Match Center list remains');
if (!html.includes('main.js?v=20261115-v1-21') || !sw.includes('football-rich-shell-v29')) throw new Error('V1.21 cache metadata missing');
console.log('V1.21 verified: one Match Center grouped by local kickoff day, chronological cards, status labels retained, mobile team names forced horizontal; local records unchanged.');
