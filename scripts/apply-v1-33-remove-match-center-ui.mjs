import fs from 'node:fs';

const mainPath='dist/main.js', htmlPath='dist/index.html', swPath='dist/sw.js', versionPath='dist/app-version.json';
const dbPath='dist/data/database.js', schemaPath='dist/data/schema.js';
let main=fs.readFileSync(mainPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
const database=fs.readFileSync(dbPath,'utf8');
const schema=fs.readFileSync(schemaPath,'utf8');

if(!main.includes("const APP_VERSION='1.32';") || !html.includes('main.js?v=20261116-v1-32') || !sw.includes("const CACHE_NAME = 'football-rich-shell-v40'")) {
  throw new Error('V1.33 expected V1.32 build anchors missing; refusing to alter an unknown build');
}
if(!schema.includes("'matches'") || !schema.includes("'match_results'") || !database.includes('backup.stores.matches') || !database.includes('match_results')) {
  throw new Error('V1.33 match/result storage schema or backup support is missing');
}

// The current app renders its entire fixture calendar, cards and Result JSON importer
// inside Dashboard. Replace only that presentation branch; retain all other views.
const dashboardStart=main.indexOf("if (currentView === 'dashboard') {");
const researchStart=main.indexOf("else if (currentView === 'research') {",dashboardStart);
if(dashboardStart<0 || researchStart<0 || researchStart<=dashboardStart) {
  throw new Error('V1.33 Dashboard/Research branch boundaries not found');
}
const dashboard=`if (currentView === 'dashboard') {
        root.innerHTML = pageTitle('FOOTBALL RICH', 'พื้นที่โปรแกรมแข่งขันกำลังปรับปรุง', 'ส่วนแสดงโปรแกรมและรายละเอียดแมตช์ถูกพักไว้ชั่วคราว ข้อมูล Match ID ไฟล์โปรแกรม ผลการแข่งขัน และสถิติหลังแข่งยังคงเก็บไว้ในอุปกรณ์');
      }
      `;
main=main.slice(0,dashboardStart)+dashboard+main.slice(researchStart);

// Remove the old match-card click delegation and the detached native-dialog controller.
main=main.replace("    root.querySelectorAll('[data-select-match]').forEach(el => el.addEventListener('click', () => { selectedMatchId = el.dataset.selectMatch ?? ''; switchView('analysis'); }));\n",'');
const modalStart=main.indexOf("if(!document.querySelector('#mc-detail-modal'))");
if(modalStart<0) throw new Error('V1.33 legacy Match Center detail controller was not found');
if(main.slice(0,modalStart).lastIndexOf('registerServiceWorker();')<0) throw new Error('V1.33 service worker registration anchor missing before detail controller');
main=main.slice(0,modalStart).trimEnd()+'\n';
main=main.replaceAll('data-go="matches"','data-go="dashboard"');

main=main.replace("const APP_VERSION='1.32';","const APP_VERSION='1.33';")
         .replace("const PREVIOUS_APP_VERSION='1.31';","const PREVIOUS_APP_VERSION='1.32';");
html=html.replace('main.js?v=20261116-v1-32','main.js?v=20261116-v1-33');
sw=sw.replaceAll('football-rich-shell-v40','football-rich-shell-v41');

fs.writeFileSync(mainPath,main);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify({version:'1.33',release:'V1.33'}));

const forbidden=['data-select-match','data-open-match-detail','mc-detail-modal','result-import-file','match-form','renderMatchesByDay','mc-day-section','mc-calendar-head','mc-status-upcoming','mc-status-live','mc-status-finished','knownClubCrests'];
for(const marker of forbidden) if(main.includes(marker)) throw new Error('V1.33 Match Center UI residue remains: '+marker);
if(main.includes('data-go="matches"')) throw new Error('V1.33 old Match Center shortcut remains');
if(!main.includes('พื้นที่โปรแกรมแข่งขันกำลังปรับปรุง') || !main.includes('ข้อมูล Match ID ไฟล์โปรแกรม ผลการแข่งขัน และสถิติหลังแข่งยังคงเก็บไว้ในอุปกรณ์')) throw new Error('V1.33 safe Dashboard placeholder missing');
if(!main.includes("else if (currentView === 'research')") || !main.includes("else if (currentView === 'analysis')")) throw new Error('V1.33 other app views were damaged');
if(!schema.includes("'matches'") || !schema.includes("'match_results'") || !database.includes('backup.stores.matches') || !database.includes('match_results')) throw new Error('V1.33 data store/backup modules were changed or lost');
if(!html.includes('main.js?v=20261116-v1-33') || !sw.includes("const CACHE_NAME = 'football-rich-shell-v41'")) throw new Error('V1.33 cache/version audit failed');
console.log('V1.33 applied: Dashboard fixture calendar/cards/Result importer and detached detail modal removed; match IDs, fixture records, results, event/revision stats and backup/schema modules retained untouched.');
