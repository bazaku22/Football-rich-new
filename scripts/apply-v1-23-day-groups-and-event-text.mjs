import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

const helperStart = main.indexOf('        const renderMatchesByDay = () => {');
const renderStart = main.indexOf('        root.innerHTML = pageTitle(', helperStart);
if (helperStart < 0 || renderStart < 0) throw new Error('V1.23 live Match Center day renderer missing');
const helper = [
"        const renderMatchesByDay = () => {",
"          if (!allMatches.length) return '<div class=\"panel empty\">ยังไม่มีรายการแข่งขัน · นำเข้าโปรแกรมหรือเพิ่มคู่แข่งขันได้เลย</div>';",
"          const getLocalDayKey = value => {",
"            if (!value) return 'undated';",
"            const date = new Date(value);",
"            if (!Number.isFinite(date.getTime())) return 'undated';",
"            return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');",
"          };",
"          const sortedMatches = allMatches.slice().sort((a,b) => {",
"            const ta = a.kickoffAt ? Date.parse(a.kickoffAt) : NaN;",
"            const tb = b.kickoffAt ? Date.parse(b.kickoffAt) : NaN;",
"            const va = Number.isFinite(ta) ? ta : Number.MAX_SAFE_INTEGER;",
"            const vb = Number.isFinite(tb) ? tb : Number.MAX_SAFE_INTEGER;",
"            return va - vb || String(a.id).localeCompare(String(b.id));",
"          });",
"          const byDay = new Map();",
"          sortedMatches.forEach(match => {",
"            const key = getLocalDayKey(match.kickoffAt);",
"            if (!byDay.has(key)) byDay.set(key, []);",
"            byDay.get(key).push(match);",
"          });",
"          return Array.from(byDay.entries()).map(([key, matches]) => {",
"            const label = key === 'undated' ? 'ไม่ระบุวันแข่งขัน' : new Intl.DateTimeFormat('th-TH', {weekday:'long', day:'numeric', month:'long', year:'numeric'}).format(new Date(key + 'T12:00:00'));",
"            return '<section class=\"mc-day-section\" data-match-day=\"' + key + '\"><div class=\"mc-day-heading\"><h3>' + esc(label) + '</h3><span class=\"count\">' + matches.length + ' คู่</span></div><div class=\"mc-cards\">' +",
"              matches.map(match => resultByMatch.has(match.id) ? renderFinished(match) : renderUpcoming(match)).join('') +",
"              '</div></section>';",
"          }).join('');",
"        };",
""
].join('\n');
main = main.slice(0, helperStart) + helper + main.slice(renderStart);

const cssPatch = [
"/* V1.23: stable mobile match details and visible day-separated Match Center */",
".mc-day-section{display:block!important;width:100%!important;min-width:0!important;margin:22px 0 28px!important}",
".mc-day-heading{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;width:100%!important;margin:0 0 12px!important;padding:0 2px 9px!important;border-bottom:1px solid #514226!important}",
".mc-day-heading h3{display:block!important;min-width:0!important;margin:0!important;color:#f4d27b!important;font-size:15px!important;font-weight:800!important;line-height:1.4!important;writing-mode:horizontal-tb!important}",
".mc-day-heading .count{flex:0 0 auto!important;color:#a99d83!important;font-size:11px!important}",
".mc-day-section .mc-cards{display:grid!important;grid-template-columns:minmax(0,1fr)!important;width:100%!important;min-width:0!important;gap:12px!important}",
"article.mc-card{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;writing-mode:horizontal-tb!important}",
"article.mc-card .mc-teams{display:grid!important;grid-template-columns:minmax(0,1fr) 36px minmax(0,1fr)!important;align-items:center!important;width:100%!important;max-width:100%!important;min-width:0!important;gap:6px!important;writing-mode:horizontal-tb!important}",
"article.mc-card .mc-team,article.mc-card .mc-team-name{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;text-align:center!important;white-space:normal!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;word-break:normal!important;overflow-wrap:anywhere!important;line-height:1.4!important}",
"article.mc-card .mc-events{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;grid-column:1/-1!important;writing-mode:horizontal-tb!important}",
"article.mc-card .mc-events *{max-width:100%!important;min-width:0!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;word-break:normal!important;overflow-wrap:anywhere!important}",
"article.mc-card .mc-event{display:flex!important;flex-direction:row!important;align-items:flex-start!important;gap:9px!important;width:100%!important;max-width:100%!important;min-width:0!important;white-space:normal!important;writing-mode:horizontal-tb!important}",
"article.mc-card .mc-event time{display:block!important;flex:0 0 38px!important;min-width:38px!important;white-space:nowrap!important}",
"article.mc-card .mc-event span{display:block!important;flex:1 1 auto!important;width:auto!important;min-width:0!important;white-space:normal!important;writing-mode:horizontal-tb!important;overflow-wrap:anywhere!important;word-break:normal!important;line-height:1.5!important}",
"@media(max-width:650px){",
"  .mc-day-section{margin:18px 0 24px!important}",
"  .mc-day-heading h3{font-size:14px!important}",
"  article.mc-card{padding:14px!important}",
"  article.mc-card .mc-teams{grid-template-columns:minmax(0,1fr) 32px minmax(0,1fr)!important;gap:4px!important;margin:15px 0!important}",
"  article.mc-card .mc-team,article.mc-card .mc-team-name{font-size:12px!important}",
"  article.mc-card .mc-event{align-items:flex-start!important;gap:7px!important}",
"  article.mc-card .mc-event span{font-size:12px!important}",
"}"
].join('\n');
if (!css.includes('V1.23: stable mobile match details and visible day-separated Match Center')) css += '\n' + cssPatch;

if (!main.includes("const APP_VERSION='1.22';")) throw new Error('V1.23 expected app version 1.22');
main=main.replace("const APP_VERSION='1.22';","const APP_VERSION='1.23';")
         .replace("const PREVIOUS_APP_VERSION='1.21';","const PREVIOUS_APP_VERSION='1.22';");
if (!html.includes('main.js?v=20261115-v1-22')) throw new Error('V1.23 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-22','main.js?v=20261116-v1-23');
if (!sw.includes('football-rich-shell-v30')) throw new Error('V1.23 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v30','football-rich-shell-v31');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.23',release:'V1.23'}));

if (!main.includes('const renderMatchesByDay = () =>') || !main.includes('data-match-day') || !main.includes('matches.map(match => resultByMatch.has(match.id) ? renderFinished(match) : renderUpcoming(match))')) throw new Error('V1.23 day-group renderer audit failed');
if (!main.includes('renderMatchesByDay() +') || main.includes('allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m)).join')) throw new Error('V1.23 flat Match Center renderer remains');
for (const rule of ['V1.23: stable mobile match details and visible day-separated Match Center','article.mc-card .mc-event span','writing-mode:horizontal-tb!important','overflow-wrap:anywhere!important']) if (!css.includes(rule)) throw new Error('V1.23 mobile layout audit failed: '+rule);
if (!html.includes('main.js?v=20261116-v1-23') || !sw.includes('football-rich-shell-v31')) throw new Error('V1.23 cache/version audit failed');
console.log('V1.23 verified: all statuses grouped by local kickoff day, matches sorted chronologically, finished event text forced horizontal on mobile, cache version bumped; local stores unchanged.');
