import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// V1.19: show every match in one chronological Match Center list.
// This is presentation-only; match, result, event, prediction and revision stores are untouched.
const oldGroup = `'<div class="mc-group"><h2>โปรแกรมการแข่งขัน</h2><span class="count">' + allMatches.filter(m => !resultByMatch.has(m.id)).length + '</span></div><div class="mc-cards">' + (allMatches.some(m => !resultByMatch.has(m.id)) ? allMatches.filter(m => !resultByMatch.has(m.id)).map(renderUpcoming).join('') : '<div class="panel empty">ไม่มีโปรแกรมการแข่งขันที่รอดำเนินการ</div>') + '</div>' +`;
const newGroup = `'<div class="mc-group"><h2>รายการแข่งขันทั้งหมด</h2><span class="count">' + allMatches.length + '</span></div><div class="mc-cards">' + (allMatches.length ? allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m)).join('') : '<div class="panel empty">ยังไม่มีรายการแข่งขัน · นำเข้าโปรแกรมหรือเพิ่มคู่แข่งขันได้เลย</div>') + '</div>' +`;
if (!main.includes(oldGroup)) {
  if (main.includes('allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m))')) {
    throw new Error('V1.19 unified all-status list already exists; refusing duplicate patch');
  }
  throw new Error('V1.19 V1.18 list anchor missing; no changes applied');
}
main=main.replace(oldGroup,newGroup);

// A match without an imported result remains in its original card, but its badge reflects
// an explicit live/finished status when supplied by the fixture data.
const statusAnchor = "          const hasKickoff = !!m.kickoffAt && !Number.isNaN(Date.parse(m.kickoffAt));";
const statusLine = `          const hasKickoff = !!m.kickoffAt && !Number.isNaN(Date.parse(m.kickoffAt));
          const rawMatchStatus = String(m.status || '').toUpperCase();
          const liveMatchStatuses = ['LIVE','IN_PLAY','INPLAY','1H','2H','HT','ET','PEN','PAUSED'];
          const cardStatus = liveMatchStatuses.includes(rawMatchStatus)
            ? '<b class="mc-status mc-status-live">กำลังแข่ง</b>'
            : rawMatchStatus === 'FINISHED'
              ? '<b class="mc-status mc-status-finished">จบแล้ว</b>'
              : '<b class="mc-status mc-status-upcoming">รอแข่ง</b>';`;
if (!main.includes(statusAnchor)) throw new Error('V1.19 upcoming status insertion anchor missing');
main=main.replace(statusAnchor,statusLine);

const oldUpcomingHeader = `<span>' + (hasKickoff ? esc(fmtDate(m.kickoffAt)) : 'ไม่ระบุเวลาแข่งขัน') + '</span></div><div class="mc-teams">`;
const newUpcomingHeader = `<span>' + (hasKickoff ? esc(fmtDate(m.kickoffAt)) : 'ไม่ระบุเวลาแข่งขัน') + cardStatus + '</span></div><div class="mc-teams">`;
if (!main.includes(oldUpcomingHeader)) throw new Error('V1.19 upcoming card header anchor missing');
main=main.replace(oldUpcomingHeader,newUpcomingHeader);

const oldFinishedBadge = '<span class="tag">ยืนยันผลแล้ว</span>';
const newFinishedBadge = '<b class="mc-status mc-status-finished">จบแล้ว</b>';
if (!main.includes(oldFinishedBadge)) throw new Error('V1.19 finished card status anchor missing');
main=main.replace(oldFinishedBadge,newFinishedBadge);

if (!main.includes("const APP_VERSION='1.18';")) throw new Error('V1.19 expected app version 1.18');
main=main.replace("const APP_VERSION='1.18';","const APP_VERSION='1.19';")
         .replace("const PREVIOUS_APP_VERSION='1.17';","const PREVIOUS_APP_VERSION='1.18';");
if (!html.includes('main.js?v=20261115-v1-18')) throw new Error('V1.19 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-18','main.js?v=20261115-v1-19');
if (!sw.includes('football-rich-shell-v26')) throw new Error('V1.19 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v26','football-rich-shell-v27');

css += css.includes('V1.19 Match Center status labels') ? '' : `
/* V1.19 Match Center status labels */
.mc-card-head{align-items:center}
.mc-card-head>span:last-child{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap;text-align:right}
.mc-status{display:inline-flex;align-items:center;justify-content:center;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800;line-height:1.2;white-space:nowrap;border:1px solid transparent}
.mc-status-upcoming{color:#f4d27b;background:#302719;border-color:#6b5429}
.mc-status-live{color:#ffb1a6;background:#3a1e1b;border-color:#8b4038}
.mc-status-finished{color:#a9d9b4;background:#1c3024;border-color:#386c49}
@media(max-width:380px){.mc-card-head{gap:5px}.mc-card-head>span:last-child{gap:5px}.mc-status{font-size:9px;padding:4px 6px}}
`;

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.19',release:'V1.19'}));

if (!main.includes(newGroup.slice(1,90)) && !main.includes('allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m))')) throw new Error('V1.19 unified list audit failed');
if (main.includes('allMatches.filter(m => !resultByMatch.has(m.id)).map(renderUpcoming)')) throw new Error('V1.19 still hides finished matches');
for (const feature of ['mc-status-upcoming','mc-status-live','mc-status-finished','รายการแข่งขันทั้งหมด']) {
  if (!main.includes(feature) && !css.includes(feature)) throw new Error('V1.19 status/list audit failed: '+feature);
}
if (!html.includes('main.js?v=20261115-v1-19') || !sw.includes('football-rich-shell-v27')) throw new Error('V1.19 cache metadata missing');
console.log('V1.19 verified: all matches visible in one kickoff-sorted Match Center with upcoming/live/finished badges; local records unchanged.');
