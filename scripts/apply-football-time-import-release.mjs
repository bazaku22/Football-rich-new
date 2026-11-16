import fs from 'node:fs';

const root='football-rich-v1/dist';
const mainPath=root+'/main.js',htmlPath=root+'/index.html',swPath=root+'/sw.js',versionPath=root+'/app-version.json';
let main=fs.readFileSync(mainPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
let sw=fs.readFileSync(swPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));

if(!main.includes("currentView === 'football-time-import'")) throw new Error('Football Time import route missing from final PWA');
if(!main.includes("const APP_VERSION='3.9.3';")) throw new Error('Expected V3.9.3 before Football Time import release bump');
if(!html.includes('main.js?v=20261116-v3-9-3')) throw new Error('Expected V3.9.3 cache-busted app entry');
if(!sw.includes("const CACHE_NAME = 'football-rich-shell-v58'")) throw new Error('Expected service worker cache v58');
if(version.version!=='3.9.3') throw new Error('Unexpected app version manifest before release bump');

main=main.replace("const APP_VERSION='3.9.3';","const APP_VERSION='3.9.4';")
  .replace("const PREVIOUS_APP_VERSION='3.9.2';","const PREVIOUS_APP_VERSION='3.9.3';")
  .replaceAll('FOOTBALL RICH · BLACK & GOLD · V3.9.3','FOOTBALL RICH · BLACK & GOLD · V3.9.4')
  .replace('<span class="tag">V3.9.3</span>','<span class="tag">V3.9.4</span>');
html=html.replaceAll('main.js?v=20261116-v3-9-3','main.js?v=20261116-v3-9-4');
sw=sw.replace("const CACHE_NAME = 'football-rich-shell-v58'","const CACHE_NAME = 'football-rich-shell-v59'");
version.previous_version='3.9.3';
version.version='3.9.4';
version.release='V3.9.4-beta.1';

fs.writeFileSync(mainPath,main);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');
console.log('Football rich V3.9.4 release metadata and service-worker cache v59 applied.');
