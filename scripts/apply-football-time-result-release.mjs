import fs from 'node:fs';
const root='football-rich-v1/dist';
const mainPath=root+'/main.js',htmlPath=root+'/index.html',swPath=root+'/sw.js',versionPath=root+'/app-version.json';
let main=fs.readFileSync(mainPath,'utf8'),html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));
if(!main.includes("currentView === 'football-time-result-import'"))throw Error('FT read-only result import route missing');
if(!main.includes("const APP_VERSION='3.9.4';"))throw Error('Expected V3.9.4 before result import release bump');
if(!html.includes('main.js?v=20261116-v3-9-4'))throw Error('Expected V3.9.4 cache-busted entry');
if(!sw.includes("const CACHE_NAME = 'football-rich-shell-v59'"))throw Error('Expected service worker cache v59');
if(version.version!=='3.9.4')throw Error('Unexpected app version manifest before V3.9.5');
main=main.replace("const APP_VERSION='3.9.4';","const APP_VERSION='3.9.5';")
 .replace("const PREVIOUS_APP_VERSION='3.9.3';","const PREVIOUS_APP_VERSION='3.9.4';")
 .replaceAll('FOOTBALL RICH · BLACK & GOLD · V3.9.4','FOOTBALL RICH · BLACK & GOLD · V3.9.5')
 .replace('<span class="tag">V3.9.4</span>','<span class="tag">V3.9.5</span>');
html=html.replaceAll('main.js?v=20261116-v3-9-4','main.js?v=20261116-v3-9-5');
sw=sw.replace("const CACHE_NAME = 'football-rich-shell-v59'","const CACHE_NAME = 'football-rich-shell-v60'");
version.previous_version='3.9.4';version.version='3.9.5';version.release='V3.9.5-beta.1';
fs.writeFileSync(mainPath,main);fs.writeFileSync(htmlPath,html);fs.writeFileSync(swPath,sw);fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');
console.log('Football rich V3.9.5 result import release metadata and service-worker cache v60 applied.');
