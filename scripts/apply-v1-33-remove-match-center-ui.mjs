import fs from 'node:fs';

const mainPath='dist/main.js', htmlPath='dist/index.html', swPath='dist/sw.js', versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');

if(!main.includes("const APP_VERSION='1.32';") || !html.includes('main.js?v=20261116-v1-32') || !sw.includes("const CACHE_NAME = 'football-rich-shell-v40'")) {
  throw new Error('V1.33 expected V1.32 build anchors missing; refusing to alter an unknown build');
}

// Remove only the Match Center navigation entry. Keep every other navigation item unchanged.
const navStart=main.indexOf('const navItems = [');
const navEnd=main.indexOf('];',navStart);
if(navStart<0 || navEnd<0) throw new Error('V1.33 navigation array not found');
let nav=main.slice(navStart,navEnd+2);
const beforeNav=nav;
nav=nav.replace(/\['matches',\s*'[^']*'\],?\s*/,'');
if(nav===beforeNav) throw new Error('V1.33 Match Center navigation entry not found');
main=main.slice(0,navStart)+nav+main.slice(navEnd+2);

// Remove all fixture cards, match detail dialogs, fixture forms and result-import UI from the Match Center route.
// The route remains as a small maintenance note in case an old internal link points to it.
const matchStart=main.indexOf("else if (currentView === 'matches') {");
const researchStart=main.indexOf("else if (currentView === 'research') {",matchStart);
if(matchStart<0 || researchStart<0 || researchStart<=matchStart) throw new Error('V1.33 Match Center route boundaries not found');
const replacement=`else if (currentView === 'matches') {
        root.innerHTML = '<div class="panel empty" role="status"><strong>ส่วนโปรแกรมแข่งขันกำลังปรับปรุง</strong><p>ข้อมูลแมตช์ รหัส Match ID ไฟล์โปรแกรม และสถิติหลังแข่งยังคงเก็บไว้ในอุปกรณ์</p></div>';
      }
      `;
main=main.slice(0,matchStart)+replacement+main.slice(researchStart);

// Any old dashboard shortcut that used to open Match Center now returns to Dashboard.
main=main.replaceAll('data-go="matches"','data-go="dashboard"');

// Release/cache metadata only. No database, IndexedDB, localStorage, import files or records are touched.
main=main.replace("const APP_VERSION='1.32';","const APP_VERSION='1.33';")
         .replace("const PREVIOUS_APP_VERSION='1.31';","const PREVIOUS_APP_VERSION='1.32';");
html=html.replace('main.js?v=20261116-v1-32','main.js?v=20261116-v1-33');
sw=sw.replaceAll('football-rich-shell-v40','football-rich-shell-v41');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify({version:'1.33',release:'V1.33'}));

// Fail closed if any Match Center UI entry point survived.
const forbidden=['data-select-match','data-open-match-detail','mc-detail-modal','result-import-file','match-form','renderMatchesByDay','mc-day-section'];
for(const marker of forbidden) if(main.includes(marker)) throw new Error('V1.33 Match Center UI residue remains: '+marker);
const navBlock=main.slice(main.indexOf('const navItems = ['),main.indexOf('];',main.indexOf('const navItems = ['))+2);
if(navBlock.includes("'matches'")) throw new Error('V1.33 Match Center nav item remains');
if(main.includes('data-go="matches"')) throw new Error('V1.33 old Match Center shortcut remains');
if(!main.includes('ข้อมูลแมตช์ รหัส Match ID ไฟล์โปรแกรม และสถิติหลังแข่งยังคงเก็บไว้ในอุปกรณ์')) throw new Error('V1.33 safe maintenance note missing');
if(!main.includes("currentView === 'matches'") || !main.includes("currentView === 'research'")) throw new Error('V1.33 route boundaries were damaged');
if(!html.includes('main.js?v=20261116-v1-33') || !sw.includes("const CACHE_NAME = 'football-rich-shell-v41'")) throw new Error('V1.33 cache/version audit failed');
console.log('V1.33 applied: Match Center navigation/cards/forms/detail dialog/result-import UI removed; match/result IndexedDB stores and all existing records left untouched.');
