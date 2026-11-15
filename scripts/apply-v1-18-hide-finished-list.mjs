import fs from 'node:fs';

const mainPath='dist/main.js', swPath='dist/sw.js', htmlPath='dist/index.html';
let main=fs.readFileSync(mainPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');

// V1.18: temporarily hide completed matches from the visible Match Center list.
// This is presentation-only: do not touch IndexedDB, matches, results, events, or revision history.
const oldGroup = `'<div class="mc-group"><h2>รายการแข่งขันทั้งหมด</h2><span class="count">' + allMatches.length + '</span></div><div class="mc-cards">' + (allMatches.length ? allMatches.map(m => resultByMatch.has(m.id) ? renderFinished(m) : renderUpcoming(m)).join('') : '<div class="panel empty">ยังไม่มีรายการแข่งขัน · นำเข้าโปรแกรมหรือเพิ่มคู่แข่งขันได้เลย</div>') + '</div>' +`;
const newGroup = `'<div class="mc-group"><h2>โปรแกรมการแข่งขัน</h2><span class="count">' + allMatches.filter(m => !resultByMatch.has(m.id)).length + '</span></div><div class="mc-cards">' + (allMatches.some(m => !resultByMatch.has(m.id)) ? allMatches.filter(m => !resultByMatch.has(m.id)).map(renderUpcoming).join('') : '<div class="panel empty">ไม่มีโปรแกรมการแข่งขันที่รอดำเนินการ</div>') + '</div>' +`;
if (!main.includes(oldGroup)) {
  if (main.includes('allMatches.filter(m => !resultByMatch.has(m.id)).map(renderUpcoming)')) {
    throw new Error('V1.18 completed-match visibility filter already exists; refusing duplicate patch');
  }
  throw new Error('V1.18 Match Center list anchor missing; no changes applied');
}
main=main.replace(oldGroup,newGroup);

if (!main.includes("const APP_VERSION='1.17';")) throw new Error('V1.18 expected app version 1.17');
main=main.replace("const APP_VERSION='1.17';","const APP_VERSION='1.18';")
         .replace("const PREVIOUS_APP_VERSION='1.16';","const PREVIOUS_APP_VERSION='1.17';");
if (!html.includes('main.js?v=20261115-v1-17')) throw new Error('V1.18 HTML cache anchor missing');
html=html.replace('main.js?v=20261115-v1-17','main.js?v=20261115-v1-18');
if (!sw.includes('football-rich-shell-v25')) throw new Error('V1.18 service worker cache anchor missing');
sw=sw.replaceAll('football-rich-shell-v25','football-rich-shell-v26');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync('dist/app-version.json',JSON.stringify({version:'1.18',release:'V1.18'}));

const groupStart=main.indexOf('โปรแกรมการแข่งขัน');
const groupEnd=main.indexOf('นำเข้าผลการแข่งขัน',groupStart);
const visibleBlock=main.slice(groupStart,groupEnd<0?undefined:groupEnd);
if (!visibleBlock.includes('allMatches.filter(m => !resultByMatch.has(m.id)).map(renderUpcoming)')) throw new Error('V1.18 visible list audit failed');
if (visibleBlock.includes('renderFinished(m)')) throw new Error('V1.18 completed match card still appears in visible list');
if (!html.includes('main.js?v=20261115-v1-18') || !sw.includes('football-rich-shell-v26')) throw new Error('V1.18 cache metadata missing');
console.log('V1.18 verified: finished matches hidden from Match Center display only; local match/result/event/history records remain untouched.');
