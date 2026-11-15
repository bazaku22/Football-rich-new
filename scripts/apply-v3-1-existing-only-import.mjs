import fs from 'node:fs';

const mainPath='dist/main.js',cssPath='dist/styles/main.css',htmlPath='dist/index.html',swPath='dist/sw.js',versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));

for(const marker of ['analysis-import-existing-only','sameKickoff','ไม่มีการสร้างแมตช์ใหม่','Match ID เดิม']) {
  if(!main.includes(marker)) throw new Error('V3.1 safe importer marker missing: '+marker);
}
if(!main.includes("const APP_VERSION='3.0';")) throw new Error('V3.1 expected V3.0 app anchor missing');
if(!html.includes('main.js?v=20261116-v3-0')) throw new Error('V3.1 expected V3.0 HTML cache anchor missing');
if(!sw.includes("const CACHE_NAME = 'football-rich-shell-v46'")) throw new Error('V3.1 expected V3.0 service worker cache anchor missing');

main=main.replace("const APP_VERSION='3.0';","const APP_VERSION='3.1';")
  .replace("const PREVIOUS_APP_VERSION='2.4';","const PREVIOUS_APP_VERSION='3.0';")
  .replaceAll('FOOTBALL RICH · BLACK & GOLD · V3.0','FOOTBALL RICH · BLACK & GOLD · V3.1')
  .replace('<span class="tag">V3.0</span>','<span class="tag">V3.1</span>');
if(!main.includes("const APP_VERSION='3.1';")) throw new Error('Could not set V3.1 app version');
css+='\n/* V3.1 safe append-only update of existing match analyses */\n#analysis-import-existing-only{accent-color:#c5a45d;flex:0 0 auto;margin-top:3px}\n';
html=html.replaceAll('main.js?v=20261116-v3-0','main.js?v=20261116-v3-1');
sw=sw.replaceAll('football-rich-shell-v46','football-rich-shell-v47');
if(!html.includes('main.js?v=20261116-v3-1')) throw new Error('Could not update V3.1 app entry');
if(!sw.includes("const CACHE_NAME = 'football-rich-shell-v47'")) throw new Error('Could not update V3.1 service worker cache');
version.version='3.1';
version.previous_version='3.0';
version.release='V3.1-beta.1';
fs.writeFileSync(mainPath,main);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');
console.log('V3.1 safe update-existing-only importer, append-only analysis versioning, app/cache version applied.');
