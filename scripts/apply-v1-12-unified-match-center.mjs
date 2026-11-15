import fs from 'node:fs';

const mainPath='dist/main.js', cssPath='dist/styles/main.css', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// One chronological Match Center list. Result presence determines card state only.
const listStart = main.indexOf('const upcomingMatches =');
const listEnd = main.indexOf('const latestAnalysis =', listStart);
const newLists = `        const allMatches = d.matches.slice().sort((a,b) => {
          const time = value => { const parsed = Date.parse(value || ''); return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER; };
          const kickoffDiff = time(a.kickoffAt) - time(b.kickoffAt);
          if (kickoffDiff !== 0) return kickoffDiff;
          const ar = resultByMatch.get(a.id), br = resultByMatch.get(b.id);
          const resultDiff = time(ar?.verifiedAt || ar?.importedAt || ar?.createdAt) - time(br?.verifiedAt || br?.importedAt || br?.createdAt);
          return resultDiff || String(a.id).localeCompare(String(b.id));
        });`;
if (listStart >= 0 && listEnd > listStart) main = main.slice(0,listStart) + newLists + '\n        ' + main.slice(listEnd);
else if (!main.includes('const allMatches = d.matches.slice().sort')) {
  const diagnostic = main.indexOf('upcomingMatches');
  throw new Error('V1.12 match list sorting anchor missing. Context: ' + main.slice(Math.max(0,diagnostic-120),diagnostic+900));
}

// Render actual club marks in both pre-match and completed match cards.
// The V1.11 renderer maps knownClubCrests and keeps initials as an image-load fallback.
const oldUpcomingTeams = `<div class="mc-teams"><div class="mc-team">' + esc(m.homeTeam) + '</div><div class="mc-vs">VS</div><div class="mc-team">' + esc(m.awayTeam) + '</div></div>`;
const crestUpcoming = `teamHtml(m.homeTeam, matchCountry(m,a), crestFor(m,a,'home'))`;
if (main.includes(oldUpcomingTeams)) main=main.replace(oldUpcomingTeams,`<div class="mc-teams">' + ${crestUpcoming} + '<div class="mc-vs">VS</div>' + teamHtml(m.awayTeam, matchCountry(m,a), crestFor(m,a,'away')) + '</div>`);
else if (!main.includes(crestUpcoming)) throw new Error('V1.12 upcoming card is missing the shared team/crest renderer');

const oldFinishedTeams = `<div class="mc-teams"><div class="mc-team">' + esc(m.homeTeam) + '</div><div class="mc-score">' + Number(r.homeGoals) + ' – ' + Number(r.awayGoals) + '</div><div class="mc-team">' + esc(m.awayTeam) + '</div></div>`;
const crestFinished = `teamHtml(m.homeTeam, matchCountry(m,a), crestFor(m,a,'home'))`;
if (main.includes(oldFinishedTeams)) main=main.replace(oldFinishedTeams,`<div class="mc-teams">' + ${crestFinished} + '<div class="mc-score">' + Number(r.homeGoals) + ' – ' + Number(r.awayGoals) + '</div>' + teamHtml(m.awayTeam, matchCountry(m,a), crestFor(m,a,'away')) + '</div>`);
else if (!main.includes(crestFinished)) throw new Error('V1.12 finished card is missing the shared team/crest renderer');

// Keep kickoff time visible on finished cards as well as the completed status.
const oldFinishedHeaders = [
  `<div class="mc-card-head"><span>' + esc(m.league) + '</span><span class="tag">ยืนยันผลแล้ว</span></div>`,
  `<div class="mc-card-head"><span>' + esc(m.league) + '</span><span class="tag">จบแล้ว</span></div>`
];
const newFinishedHeader = `<div class="mc-card-head"><span>' + esc(m.league) + '</span><span>' + (m.kickoffAt ? esc(fmtDate(m.kickoffAt)) : 'ไม่ระบุเวลาแข่งขัน') + ' · <b class="tag">จบแล้ว</b></span></div>`;
const finishedHeaderAnchor = oldFinishedHeaders.find(anchor => main.includes(anchor));
if (finishedHeaderAnchor) main=main.replace(finishedHeaderAnchor,newFinishedHeader);
else if (!main.includes('ไม่ระบุเวลาแข่งขัน') || !main.includes('fmtDate(m.kickoffAt)')) throw new Error('V1.12 finished card date anchor missing; supported completed-state header variants not found');

// Replace the two separated sections with one list, retaining the same match-card layouts.
const oldGroups = `          '<div class="mc-group"><h2>ก่อนแข่งขัน</h2><span class="count">' + upcomingMatches.length + '</span></div><div class="mc-cards">' + (upcomingMatches.length ? upcomingMatches.map(renderUpcoming).join('') : '<div class="panel empty">ไม่มีคู่ที่รอแข่งขัน</div>') + '</div>' +
          '<div class="mc-group"><h2>หลังแข่งขัน</h2><span class="count">' + finishedMatches.length + '</span></div><div class="mc-cards">' + (finishedMatches.length ? finishedMatches.map(renderFinished).join('') : '<div class="panel empty">ยังไม่มีผลการแข่งขันที่ยืนยันแล้ว</div>') + '</div>' +`;
const newGroups = `          '<div class="mc-group"><h2>รายการแข่งขันทั้งหมด</h2><span class="count">' + allMatches.length + '</span></div><div class="mc-cards">' + (allMatches.length ? allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m)).join('') : '<div class="panel empty">ยังไม่มีรายการแข่งขัน · นำเข้าโปรแกรมหรือเพิ่มคู่แข่งขันได้เลย</div>') + '</div>' +`;
if (main.includes(oldGroups)) main=main.replace(oldGroups,newGroups);
else if (!main.includes('รายการแข่งขันทั้งหมด') || main.includes(`<h2>ก่อนแข่งขัน</h2>`) || main.includes(`<h2>หลังแข่งขัน</h2>`)) throw new Error('V1.12 unified Match Center sections anchor missing');

const oldToolbar = 'ก่อนแข่งขันจะไม่ย้ายกลุ่มเพียงเพราะเวลาคิกออฟผ่านไป ต้องมี Result JSON ที่ยืนยันแล้วเท่านั้น';
main=main.replace(oldToolbar,'รายการทั้งหมดเรียงตามวันและเวลาแข่งขัน · การ์ดจะเปลี่ยนเป็นสถานะจบแล้วเมื่อมีการนำเข้าผลที่ยืนยัน');

const cssPatch = `
/* V1.12 unified chronological Match Center and real club crests */
.mc-team{display:flex;align-items:center;justify-content:center;gap:8px;min-width:0;font-size:13px;font-weight:750;overflow-wrap:anywhere;color:#e9e3d5}
.mc-team-name{min-width:0;overflow-wrap:anywhere}
.mc-team-mark{position:relative;display:inline-flex;flex:0 0 38px;width:38px;height:42px;align-items:center;justify-content:center;vertical-align:middle}
.mc-team-mark.mc-team-crest{flex-basis:38px;width:38px;height:42px}
.mc-team-mark.mc-team-crest img{display:block;width:100%;height:100%;object-fit:contain}
.mc-team-mark:not(.mc-team-crest){border:1px solid #8d6b2b;border-radius:10px;background:#211d14;color:#f4d27b}
.mc-team-mark:not(.mc-team-crest) b{font-size:12px}
.mc-team-mark i{position:absolute;right:-4px;bottom:-3px;font-style:normal;font-size:13px;line-height:1;text-shadow:0 1px 3px #000}
.mc-card-head .tag{white-space:nowrap}
@media(max-width:650px){.mc-team-mark,.mc-team-mark.mc-team-crest{flex-basis:32px;width:32px;height:36px}.mc-team{gap:6px;font-size:12px}.mc-score{font-size:25px}}
`;
if (!css.includes('V1.12 unified chronological Match Center')) css += '\n'+cssPatch;

// Release and cache metadata.
if (!main.includes(`const APP_VERSION='1.11';`)) throw new Error('V1.12 expected app version 1.11');
main=main.replace(`const APP_VERSION='1.11';`,`const APP_VERSION='1.12';`)
         .replace(`const PREVIOUS_APP_VERSION='1.10';`,`const PREVIOUS_APP_VERSION='1.11';`);
html=html.replace('main.js?v=20261115-v1-11','main.js?v=20261115-v1-12');
sw=sw.replaceAll('football-rich-shell-v19','football-rich-shell-v20');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.12',release:'V1.12'}));

for (const needle of ['const allMatches = d.matches.slice().sort','รายการแข่งขันทั้งหมด',"teamHtml(m.homeTeam, matchCountry(m,a), crestFor(m,a,'home'))","teamHtml(m.awayTeam, matchCountry(m,a), crestFor(m,a,'away'))",'knownClubCrests','mc-team-crest']) {
  if (!main.includes(needle)) throw new Error('V1.12 audit failed: '+needle);
}
if (main.includes('<h2>ก่อนแข่งขัน</h2>') || main.includes('<h2>หลังแข่งขัน</h2>')) throw new Error('V1.12 old split sections remain');
if (!html.includes('main.js?v=20261115-v1-12')) throw new Error('V1.12 cache-busted entry missing');
if (!sw.includes(`football-rich-shell-v20`)) throw new Error('V1.12 service worker cache missing');
console.log('V1.12: unified all matches by kickoff time, rendered club crest helper in both card states, and updated release metadata.');
