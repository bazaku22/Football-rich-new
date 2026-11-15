import fs from 'node:fs';

const mainPath='dist/main.js',htmlPath='dist/index.html',swPath='dist/sw.js',versionPath='dist/app-version.json';
let main=fs.readFileSync(mainPath,'utf8'),html=fs.readFileSync(htmlPath,'utf8'),sw=fs.readFileSync(swPath,'utf8');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));

if(version.version!=='3.5'||!main.includes("const APP_VERSION='3.5';")||!html.includes('main.js?v=20261116-v3-5')||!sw.includes("const CACHE_NAME = 'football-rich-shell-v51'")) {
  throw Error('V3.6 expected V3.5 build anchors missing');
}

const anchor="const resultFile = document.querySelector('#result-import-file');";
if(!main.includes(anchor)) throw Error('Result Import file handler anchor missing');

const safeMessage="const safeResultMessage=(message,kind='notice')=>{const node=root.querySelector('#result-import-message');if(node){node.textContent=String(message);node.className='notice '+kind;return;}const fallback=root.querySelector('#result-import-preview');if(fallback){const p=document.createElement('p');p.className='notice '+kind;p.textContent=String(message);fallback.prepend(p);}};\n        ";
main=main.replace(anchor,safeMessage+"const resultFile = root.querySelector('#result-import-file');");
main=main.replace("const preview = document.querySelector('#result-import-preview');","const preview = root.querySelector('#result-import-preview');");
main=main.replaceAll("setMessage('#result-import-message',","safeResultMessage(");
main=main.replace("document.querySelector('#allow-result-correction')","root.querySelector('#allow-result-correction')");
main=main.replace("document.querySelector('#confirm-result-import')","root.querySelector('#confirm-result-import')");
main=main.replace("const correctionAllowed = !!root.querySelector('#allow-result-correction')?.checked;","const correctionAllowed = !!root.querySelector('#allow-result-correction')?.checked;");

if(main.includes("setMessage('#result-import-message',")) throw Error('Unsafe Result Import status updater remains');
if(!main.includes("const safeResultMessage=(message,kind='notice')=>")) throw Error('Safe Result Import status updater missing');
if(!main.includes("const resultFile = root.querySelector('#result-import-file');")) throw Error('Result Import file input is not scoped to app root');
if(!main.includes('safeResultMessage(')) throw Error('Result Import error handler was not hardened');

main=main.replace("const APP_VERSION='3.5';","const APP_VERSION='3.6';")
 .replace("const PREVIOUS_APP_VERSION='3.4';","const PREVIOUS_APP_VERSION='3.5';")
 .replaceAll('FOOTBALL RICH · BLACK & GOLD · V3.5','FOOTBALL RICH · BLACK & GOLD · V3.6')
 .replace('<span class="tag">V3.5</span>','<span class="tag">V3.6</span>');
html=html.replaceAll('main.js?v=20261116-v3-5','main.js?v=20261116-v3-6');
sw=sw.replaceAll('football-rich-shell-v51','football-rich-shell-v52');
version.version='3.6';version.previous_version='3.5';version.release='V3.6-beta.1';

fs.writeFileSync(mainPath,main);
fs.writeFileSync(htmlPath,html);
fs.writeFileSync(swPath,sw);
fs.writeFileSync(versionPath,JSON.stringify(version,null,2)+'\n');
console.log('V3.6 hardened Result Import status updates: missing status nodes now fall back safely, and selectors are scoped to the app root.');
